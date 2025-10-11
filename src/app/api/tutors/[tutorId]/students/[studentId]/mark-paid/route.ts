import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tutorId: string; studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tutorId, studentId } = await params
    const body = await request.json()
    const { reason } = body

    // Verify the tutor belongs to the current user
    const tutor = await db.tutor.findFirst({
      where: {
        userId: session.user.id,
        id: tutorId
      }
    })

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found or unauthorized' }, { status: 404 })
    }

    // Find all unpaid lecture hours for this student-tutor combination
    const lectureHours = await db.lectureHours.findMany({
      where: {
        studentId: studentId,
        tutorId: tutor.id,
        unpaidHours: {
          gt: 0
        }
      }
    })

    if (lectureHours.length === 0) {
      return NextResponse.json({ error: 'No unpaid hours found' }, { status: 404 })
    }

    let totalHoursMarkedPaid = 0
    let totalAmountMarkedPaid = 0

    // Mark all unpaid hours as paid
    for (const lectureHour of lectureHours) {
      const unpaidHours = Number(lectureHour.unpaidHours)
      const hourlyRate = Number(tutor.hourlyRate || 50)
      const unpaidAmount = unpaidHours * hourlyRate

      totalHoursMarkedPaid += unpaidHours
      totalAmountMarkedPaid += unpaidAmount

      // Create a payment record
      await db.payment.create({
        data: {
          lectureHoursId: lectureHour.id,
          amount: unpaidAmount,
          hoursIncluded: unpaidHours,
          status: 'PAID',
          dueDate: new Date(),
          paidDate: new Date(),
          paymentMethod: 'manual',
          notes: reason || 'Manually marked as paid by tutor'
        }
      })

      // Reset unpaid hours to 0
      await db.lectureHours.update({
        where: { id: lectureHour.id },
        data: {
          unpaidHours: 0,
          reminderSent: false
        }
      })
    }

    // Create audit log entry
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MARK_PAID',
        resource: 'payment',
        resourceId: studentId,
        details: {
          studentId,
          totalHoursMarkedPaid,
          totalAmountMarkedPaid,
          reason
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true,
      hoursMarkedPaid: totalHoursMarkedPaid,
      amountMarkedPaid: totalAmountMarkedPaid
    })
  } catch (error) {
    console.error('Error marking payment as received:', error)
    return NextResponse.json(
      { error: 'Failed to mark payment as received' },
      { status: 500 }
    )
  }
}