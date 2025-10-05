import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'
import { z } from 'zod'

const createSessionSchema = z.object({
  appointmentId: z.string(),
  actualStartTime: z.string().datetime(),
  actualEndTime: z.string().datetime(),
  notes: z.string().optional(),
})

const manualSessionSchema = z.object({
  lectureHoursId: z.string(),
  duration: z.number().positive(),
  notes: z.string().optional(),
})

const updatePaymentIntervalSchema = z.object({
  lectureHoursId: z.string(),
  paymentInterval: z.number().positive(),
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

      // Convert Decimal fields to numbers for frontend consumption
      const convertedLectureHours = lectureHours.map(lh => ({
        ...lh,
        totalHours: parseFloat(lh.totalHours.toString()),
        unpaidHours: parseFloat(lh.unpaidHours.toString()),
        payments: lh.payments.map(payment => ({
          ...payment,
          amount: parseFloat(payment.amount.toString()),
          hoursIncluded: parseFloat(payment.hoursIncluded.toString())
        }))
      }))

      return NextResponse.json({ lectureHours: convertedLectureHours })
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

    // Convert Decimal fields to numbers for frontend consumption
    const convertedLectureHours = lectureHours.map(lh => ({
      ...lh,
      totalHours: parseFloat(lh.totalHours.toString()),
      unpaidHours: parseFloat(lh.unpaidHours.toString()),
      payments: lh.payments.map(payment => ({
        ...payment,
        amount: parseFloat(payment.amount.toString()),
        hoursIncluded: parseFloat(payment.hoursIncluded.toString())
      }))
    }))

    return NextResponse.json({ 
      lectureHours: convertedLectureHours,
      remindersNeeded 
    })
  } catch (error) {
    console.error('Get lecture hours error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Record a completed session or add payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if this is an add payment request
    if (body.action === 'addPayment') {
      return await handleAddPayment(body)
    }
    
    // Check if this is a payment interval update
    if (body.action === 'updatePaymentInterval') {
      return await handleUpdatePaymentInterval(body)
    }
    
    // Check if this is a manual session recording
    if (body.lectureHoursId && body.duration && !body.appointmentId) {
      return await handleManualSessionRecording(body)
    }
    
    // Default to appointment-based session recording
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

// Handle add payment action
async function handleAddPayment(body: any) {
  try {
    const { lectureHoursId, amount, hoursIncluded, paymentMethod, transactionId, notes, paidDate, userId } = body
    
    // Validate required fields
    if (!lectureHoursId || !amount || !hoursIncluded || !paymentMethod || !paidDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the lecture hours record exists and user has permission
    const lectureHours = await db.lectureHours.findFirst({
      where: { 
        id: lectureHoursId,
        tutor: {
          userId: userId // Ensure tutor owns this record
        }
      },
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
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    })

    if (!lectureHours) {
      return NextResponse.json({ error: 'Lecture hours record not found or unauthorized' }, { status: 404 })
    }

    // Create the payment record
    const payment = await db.payment.create({
      data: {
        lectureHoursId,
        amount: parseFloat(amount),
        hoursIncluded: parseFloat(hoursIncluded),
        status: 'PAID',
        dueDate: new Date(paidDate), // Set due date same as paid date for manually added payments
        paidDate: new Date(paidDate),
        paymentMethod,
        transactionId: transactionId || null,
        notes: notes || null
      }
    })

    // Update the lecture hours to reduce unpaid hours
    const currentUnpaidHours = parseFloat(lectureHours.unpaidHours.toString())
    const newUnpaidHours = Math.max(0, currentUnpaidHours - parseFloat(hoursIncluded))

    await db.lectureHours.update({
      where: { id: lectureHoursId },
      data: {
        unpaidHours: newUnpaidHours
      }
    })

    // Create notification for student about payment received
    await db.notification.create({
      data: {
        userId: lectureHours.student.userId,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: `Your payment of $${amount} for ${hoursIncluded} hours of ${lectureHours.subject} has been recorded.`,
        channels: ['email'],
        data: {
          paymentId: payment.id,
          amount,
          hoursIncluded,
          paymentMethod,
          subject: lectureHours.subject
        }
      }
    })

    return NextResponse.json({ 
      payment,
      message: 'Payment added successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Add payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update payment status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle different action formats
    if (body.action === 'markPaymentPaid') {
      return await handleMarkPaymentPaid(body)
    }
    
    // Default to schema validation for other updates
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

// Handle mark payment as paid action
async function handleMarkPaymentPaid(body: any) {
  try {
    const { paymentId, userId } = body
    
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
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

    // Verify user has permission (must be the tutor)
    if (payment.lectureHours.tutor.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update payment to paid status
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: payment.paymentMethod || 'Not specified'
      }
    })

    // Update lecture hours to reduce unpaid hours
    const hoursIncluded = parseFloat(payment.hoursIncluded.toString())
    const currentUnpaidHours = parseFloat(payment.lectureHours.unpaidHours.toString())
    const newUnpaidHours = Math.max(0, currentUnpaidHours - hoursIncluded)

    await db.lectureHours.update({
      where: { id: payment.lectureHoursId },
      data: {
        unpaidHours: newUnpaidHours
      }
    })

    // Send notification to student
    await db.notification.create({
      data: {
        userId: payment.lectureHours.student.userId,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Marked as Received',
        message: `Your payment of $${payment.amount} for ${hoursIncluded} hours of ${payment.lectureHours.subject} has been marked as received.`,
        channels: ['email'],
        data: {
          paymentId: payment.id,
          amount: payment.amount.toString(),
          hoursIncluded: hoursIncluded.toString(),
          subject: payment.lectureHours.subject
        }
      }
    })

    return NextResponse.json({ 
      payment: updatedPayment,
      message: 'Payment marked as paid successfully'
    })
    
  } catch (error) {
    console.error('Mark payment paid error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle manual session recording
async function handleManualSessionRecording(body: any) {
  try {
    const data = manualSessionSchema.parse(body)
    
    // Get the lecture hours record
    const lectureHours = await db.lectureHours.findUnique({
      where: { id: data.lectureHoursId },
      include: {
        student: {
          include: { user: true }
        },
        tutor: {
          include: { user: true }
        }
      }
    })
    
    if (!lectureHours) {
      return NextResponse.json({ error: 'Lecture hours record not found' }, { status: 404 })
    }
    
    // Update lecture hours totals directly (no session record for manual entries)
    const currentTotalHours = parseFloat(lectureHours.totalHours.toString())
    const currentUnpaidHours = parseFloat(lectureHours.unpaidHours.toString())
    
    const updatedLectureHours = await db.lectureHours.update({
      where: { id: data.lectureHoursId },
      data: {
        totalHours: currentTotalHours + data.duration,
        unpaidHours: currentUnpaidHours + data.duration,
        lastSessionDate: new Date()
      }
    })
    
    // Send notification to student
    await db.notification.create({
      data: {
        userId: lectureHours.student.userId,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'New Session Recorded',
        message: `A new ${data.duration} hour music session has been recorded by ${lectureHours.tutor.user.firstName} ${lectureHours.tutor.user.lastName}`,
        data: {
          lectureHoursId: data.lectureHoursId,
          duration: data.duration.toString(),
          subject: lectureHours.subject
        }
      }
    })
    
    return NextResponse.json({ 
      lectureHours: updatedLectureHours,
      message: 'Session recorded successfully'
    })
    
  } catch (error) {
    console.error('Manual session recording error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle payment interval updates
async function handleUpdatePaymentInterval(body: any) {
  try {
    const data = updatePaymentIntervalSchema.parse(body)
    
    const lectureHours = await db.lectureHours.update({
      where: { id: data.lectureHoursId },
      data: {
        paymentInterval: data.paymentInterval
      },
      include: {
        student: {
          include: { user: true }
        },
        tutor: {
          include: { user: true }
        }
      }
    })
    
    // Send notification to student about the change
    await db.notification.create({
      data: {
        userId: lectureHours.student.userId,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'Payment Schedule Updated',
        message: `Payment frequency has been updated to every ${data.paymentInterval} hours for ${lectureHours.subject} sessions`,
        data: {
          lectureHoursId: data.lectureHoursId,
          paymentInterval: data.paymentInterval.toString(),
          subject: lectureHours.subject
        }
      }
    })
    
    return NextResponse.json({ 
      lectureHours,
      message: 'Payment interval updated successfully'
    })
    
  } catch (error) {
    console.error('Update payment interval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}