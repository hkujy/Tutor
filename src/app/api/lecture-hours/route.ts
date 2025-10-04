import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'
import { z } from 'zod'

const createSessionSchema = z.object({
  appointmentId: z.string(),
  actualStartTime: z.string().datetime(),
  actualEndTime: z.string().datetime(),
  notes: z.string().optional(),
})

const updatePaymentSchema = z.object({
  paymentId: z.string(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']),
  paidDate: z.string().datetime().optional(),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
})

// GET - Get lecture hours for student-tutor pair
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const payments = searchParams.get('payments')
    const studentId = searchParams.get('studentId')
    const tutorId = searchParams.get('tutorId')
    const subject = searchParams.get('subject')

    // Handle new role-based queries
    if (userId && role) {
      let whereClause: any = {}
      
      if (role === 'student') {
        // Find student record from user ID
        const student = await db.student.findFirst({
          where: { userId }
        })
        if (!student) {
          return NextResponse.json({ lectureHours: [] })
        }
        whereClause = { studentId: student.id }
      } else if (role === 'tutor') {
        // Find tutor record from user ID
        const tutor = await db.tutor.findFirst({
          where: { userId }
        })
        if (!tutor) {
          return NextResponse.json({ lectureHours: [] })
        }
        whereClause = { tutorId: tutor.id }
      }

      const lectureHours = await db.lectureHours.findMany({
        where: whereClause,
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          },
          tutor: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          },
          sessions: {
            orderBy: { actualStartTime: 'desc' },
            take: 10,
            include: {
              appointment: {
                select: { subject: true, startTime: true, endTime: true }
              }
            }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      return NextResponse.json({ lectureHours })
    }

    // Legacy parameter handling
    if (!studentId && !tutorId) {
      return NextResponse.json({ error: 'Either studentId or tutorId is required' }, { status: 400 })
    }

    let whereClause: any = {}
    if (studentId && tutorId) {
      whereClause = { studentId, tutorId }
      if (subject) whereClause.subject = subject
    } else if (studentId) {
      whereClause = { studentId }
    } else if (tutorId) {
      whereClause = { tutorId }
    }

    const lectureHours = await db.lectureHours.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        tutor: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        sessions: {
          orderBy: { actualStartTime: 'desc' },
          take: 10,
          include: {
            appointment: {
              select: { subject: true, startTime: true, endTime: true }
            }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    // Calculate payment reminders needed
    const remindersNeeded = []
    for (const record of lectureHours) {
      const unpaidHours = parseFloat(record.unpaidHours.toString())
      const paymentInterval = record.paymentInterval
      
      if (unpaidHours >= paymentInterval - 1 && unpaidHours < paymentInterval && !record.reminderSent) {
        remindersNeeded.push({
          lectureHoursId: record.id,
          studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
          tutorName: `${record.tutor.user.firstName} ${record.tutor.user.lastName}`,
          subject: record.subject,
          unpaidHours,
          paymentInterval
        })
      }
    }

    return NextResponse.json({ 
      lectureHours,
      remindersNeeded 
    })
  } catch (error) {
    console.error('Get lecture hours error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Record a completed session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createSessionSchema.parse(body)

    // Get appointment details
    const appointment = await db.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        student: true,
        tutor: true
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Calculate session duration in hours
    const startTime = new Date(data.actualStartTime)
    const endTime = new Date(data.actualEndTime)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationHours = durationMs / (1000 * 60 * 60) // Convert to hours

    if (durationHours <= 0) {
      return NextResponse.json({ error: 'Invalid session duration' }, { status: 400 })
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
      lectureHours = await db.lectureHours.create({
        data: {
          studentId: appointment.studentId,
          tutorId: appointment.tutorId,
          subject: appointment.subject,
          totalHours: durationHours,
          unpaidHours: durationHours,
          lastSessionDate: endTime
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
        appointmentId: data.appointmentId,
        duration: durationHours,
        actualStartTime: startTime,
        actualEndTime: endTime,
        notes: data.notes
      }
    })

    // Update appointment status to COMPLETED
    await db.appointment.update({
      where: { id: data.appointmentId },
      data: { status: 'COMPLETED' }
    })

    // Get the appointment with user data for notifications
    const appointmentWithUsers = await db.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        student: {
          include: { user: true }
        },
        tutor: {
          include: { user: true }
        }
      }
    })

    if (!appointmentWithUsers) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Check if payment reminder should be triggered
    const unpaidHours = parseFloat(lectureHours.unpaidHours.toString())
    const paymentInterval = lectureHours.paymentInterval
    
    let reminderTriggered = false
    if (unpaidHours >= paymentInterval - 1 && !lectureHours.reminderSent) {
      // Create payment reminder notifications
      await Promise.all([
        // Notification for student
        db.notification.create({
          data: {
            userId: appointmentWithUsers.student.userId,
            type: 'PAYMENT_REMINDER',
            title: 'Payment Reminder',
            message: `You have ${unpaidHours.toFixed(1)} hours of tutoring. Payment is due soon for your ${appointmentWithUsers.subject} sessions with ${appointmentWithUsers.tutor.user.firstName}.`,
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

      reminderTriggered = true
    }

    return NextResponse.json({ 
      session,
      lectureHours,
      reminderTriggered,
      unpaidHours
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Create session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update payment status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const data = updatePaymentSchema.parse(body)

    const payment = await db.payment.findUnique({
      where: { id: data.paymentId },
      include: {
        lectureHours: {
          include: {
            student: { include: { user: true } },
            tutor: { include: { user: true } }
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment
    const updatedPayment = await db.payment.update({
      where: { id: data.paymentId },
      data: {
        status: data.status,
        paidDate: data.paidDate ? new Date(data.paidDate) : undefined,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        notes: data.notes
      }
    })

    // If payment is marked as PAID, update lecture hours
    if (data.status === 'PAID') {
      const hoursIncluded = parseFloat(payment.hoursIncluded.toString())
      const currentUnpaidHours = parseFloat(payment.lectureHours.unpaidHours.toString())
      const newUnpaidHours = Math.max(0, currentUnpaidHours - hoursIncluded)

      await db.lectureHours.update({
        where: { id: payment.lectureHoursId },
        data: {
          unpaidHours: newUnpaidHours,
          reminderSent: false // Reset for next cycle
        }
      })

      // Mark related sessions as paid
      await db.lectureSession.updateMany({
        where: {
          lectureHoursId: payment.lectureHoursId,
          paid: false
        },
        data: { paid: true }
      })

      // Send payment confirmation notifications
      await Promise.all([
        db.notification.create({
          data: {
            userId: payment.lectureHours.student.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Received',
            message: `Thank you! Your payment of $${payment.amount} for ${hoursIncluded} hours of ${payment.lectureHours.subject} tutoring has been received.`,
            channels: ['email']
          }
        }),
        db.notification.create({
          data: {
            userId: payment.lectureHours.tutor.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Received',
            message: `Payment received from ${payment.lectureHours.student.user.firstName} ${payment.lectureHours.student.user.lastName} for ${hoursIncluded} hours of ${payment.lectureHours.subject} tutoring.`,
            channels: ['email']
          }
        })
      ])
    }

    return NextResponse.json({ payment: updatedPayment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Update payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}