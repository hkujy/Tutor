import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'
import { z } from 'zod'

const appointmentSchema = z.object({
  tutorId: z.string(),
  studentId: z.string(),
  date: z.string(), // ISO date
  time: z.string(), // HH:MM
  subject: z.string(),
  duration: z.number().optional().default(60), // Duration in minutes
  notes: z.string().optional(), // Optional notes
})

const updateAppointmentSchema = z.object({
  id: z.string(),
  date: z.string().optional(),
  time: z.string().optional(),
  subject: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
  duration: z.number().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const appointments = await db.appointment.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        tutor: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    })
    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Fetch appointments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = appointmentSchema.parse(body)

    // Combine date and time into a Date object
    const startTime = new Date(`${data.date}T${data.time}:00Z`)
    const endTime = new Date(startTime.getTime() + data.duration * 60 * 1000) // Duration in minutes

    const appointment = await db.appointment.create({
      data: {
        tutorId: data.tutorId,
        studentId: data.studentId,
        startTime,
        endTime,
        subject: data.subject,
        status: 'SCHEDULED',
        notes: data.notes || null,
      },
    })

    // Get student and tutor info for notification
    const [student, tutor] = await Promise.all([
      db.student.findUnique({
        where: { id: data.studentId },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }
      }),
      db.tutor.findUnique({
        where: { id: data.tutorId },
        include: { user: { select: { firstName: true, lastName: true } } }
      })
    ])

    // Send notification to student about new appointment
    if (student && tutor) {
      try {
        await db.notification.create({
          data: {
            userId: student.user.id,
            type: 'APPOINTMENT_REMINDER',
            title: 'New Appointment Scheduled',
            message: `${tutor.user.firstName} ${tutor.user.lastName} has scheduled a ${data.subject} session for ${new Date(startTime).toLocaleDateString()} at ${new Date(startTime).toLocaleTimeString()}.`,
            channels: ['in_app', 'email'],
            data: {
              appointmentId: appointment.id,
              tutorName: `${tutor.user.firstName} ${tutor.user.lastName}`,
              subject: data.subject,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString()
            }
          }
        })
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError)
        // Don't fail the appointment creation if notification fails
      }
    }

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Appointment creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update/reschedule appointment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const data = updateAppointmentSchema.parse(body)

    // Build update data object
    const updateData: any = {}
    
    if (data.date && data.time) {
      const startTime = new Date(`${data.date}T${data.time}:00Z`)
      updateData.startTime = startTime
      
      if (data.duration) {
        updateData.endTime = new Date(startTime.getTime() + data.duration * 60 * 1000)
      }
    }
    
    if (data.subject) updateData.subject = data.subject
    if (data.status) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    const appointment = await db.appointment.update({
      where: { id: data.id },
      data: updateData,
      include: {
        tutor: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    })

    // If appointment is marked as COMPLETED, automatically create/update lecture hours
    if (data.status === 'COMPLETED') {
      await handleCompletedAppointment(appointment)
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Appointment update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Cancel appointment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 })
    }

    // Soft delete by updating status to CANCELLED
    const appointment = await db.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        tutor: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Appointment cancellation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle completed appointment - automatically create lecture hours and session
async function handleCompletedAppointment(appointment: any) {
  try {
    // Calculate session duration in hours
    const startTime = new Date(appointment.startTime)
    const endTime = new Date(appointment.endTime)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationHours = durationMs / (1000 * 60 * 60) // Convert to hours

    if (durationHours <= 0) {
      console.warn('Invalid appointment duration:', durationHours)
      return
    }

    // Find or create lecture hours record
    let lectureHours = await db.lectureHours.findUnique({
      where: {
        studentId_tutorId_subject: {
          studentId: appointment.studentId,
          tutorId: appointment.tutorId,
          subject: appointment.subject
        }
      }
    })

    if (!lectureHours) {
      // Create new lecture hours record
      lectureHours = await db.lectureHours.create({
        data: {
          studentId: appointment.studentId,
          tutorId: appointment.tutorId,
          subject: appointment.subject,
          totalHours: durationHours,
          unpaidHours: durationHours,
          lastSessionDate: endTime,
          paymentInterval: 10 // Default to 10 hours payment interval
        }
      })
    } else {
      // Update existing record
      const newTotalHours = parseFloat(lectureHours.totalHours.toString()) + durationHours
      const newUnpaidHours = parseFloat(lectureHours.unpaidHours.toString()) + durationHours

      lectureHours = await db.lectureHours.update({
        where: { id: lectureHours.id },
        data: {
          totalHours: newTotalHours,
          unpaidHours: newUnpaidHours,
          lastSessionDate: endTime,
          reminderSent: false // Reset reminder flag when new hours are added
        }
      })
    }

    // Create the session record
    const session = await db.lectureSession.create({
      data: {
        lectureHoursId: lectureHours.id,
        appointmentId: appointment.id,
        duration: durationHours,
        actualStartTime: startTime,
        actualEndTime: endTime,
        notes: appointment.notes || null
      }
    })

    // Check if payment reminder should be triggered
    const unpaidHours = parseFloat(lectureHours.unpaidHours.toString())
    const paymentInterval = lectureHours.paymentInterval || 10

    if (unpaidHours >= paymentInterval && !lectureHours.reminderSent) {
      // Get appointment with user details for notifications
      const appointmentWithUsers = await db.appointment.findUnique({
        where: { id: appointment.id },
        include: {
          student: { include: { user: true } },
          tutor: { include: { user: true } }
        }
      })

      if (appointmentWithUsers) {
        // Create payment reminder notifications
        await Promise.all([
          // Notification for student
          db.notification.create({
            data: {
              userId: appointmentWithUsers.student.userId,
              type: 'PAYMENT_REMINDER',
              title: 'Payment Reminder',
              message: `You have ${unpaidHours.toFixed(1)} unpaid hours for ${appointmentWithUsers.subject} sessions. Please arrange payment with your tutor.`,
              channels: ['email'],
              data: {
                lectureHoursId: lectureHours.id,
                unpaidHours,
                paymentInterval,
                subject: appointmentWithUsers.subject
              }
            }
          }),
          // Notification for tutor
          db.notification.create({
            data: {
              userId: appointmentWithUsers.tutor.userId,
              type: 'PAYMENT_REMINDER',
              title: 'Payment Reminder - Student',
              message: `${appointmentWithUsers.student.user.firstName} ${appointmentWithUsers.student.user.lastName} has ${unpaidHours.toFixed(1)} unpaid hours for ${appointmentWithUsers.subject} sessions.`,
              channels: ['email'],
              data: {
                lectureHoursId: lectureHours.id,
                unpaidHours,
                paymentInterval,
                subject: appointmentWithUsers.subject
              }
            }
          })
        ])

        // Mark reminder as sent
        await db.lectureHours.update({
          where: { id: lectureHours.id },
          data: { reminderSent: true }
        })
      }
    }

    console.log(`Lecture hours automatically created for appointment ${appointment.id}: ${durationHours} hours`)
    return { lectureHours, session }
    
  } catch (error) {
    console.error('Error handling completed appointment:', error)
    // Don't throw error to avoid breaking appointment update
  }
}
