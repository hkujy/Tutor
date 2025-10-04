import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db as prisma } from '@/lib/db/client'

const reminderSchema = z.object({
  paymentId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId } = reminderSchema.parse(body)

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lectureHours: {
          include: {
            student: {
              include: { user: true }
            },
            tutor: {
              include: { user: true }
            }
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Create notification for payment reminder
    await prisma.notification.create({
      data: {
        userId: payment.lectureHours.student.userId,
        type: 'PAYMENT_REMINDER',
        title: 'Payment Reminder',
        message: `Payment of $${payment.amount.toFixed(2)} for ${payment.hoursIncluded} hours of ${payment.lectureHours.subject} lessons is due on ${new Date(payment.dueDate).toLocaleDateString()}.`,
        channels: ['email']
      }
    })

    // Also create notification for tutor (confirmation that reminder was sent)
    await prisma.notification.create({
      data: {
        userId: payment.lectureHours.tutor.userId,
        type: 'PAYMENT_REMINDER',
        title: 'Payment Reminder Sent',
        message: `Payment reminder sent to ${payment.lectureHours.student.user.firstName} ${payment.lectureHours.student.user.lastName} for $${payment.amount.toFixed(2)} payment.`,
        channels: ['email']
      }
    })

    // Update payment with reminder sent count
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        remindersSent: { increment: 1 },
        lastReminderAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment reminder error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}