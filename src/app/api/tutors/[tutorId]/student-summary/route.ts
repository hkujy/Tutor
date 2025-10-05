import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  try {
    const { tutorId } = await params // This is actually the user ID

    // Find the tutor record from the user ID
    const tutor = await db.tutor.findFirst({
      where: {
        userId: tutorId
      },
      select: {
        id: true,
        hourlyRate: true
      }
    })

    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    // Get all lecture hours for this tutor
    const lectureHours = await db.lectureHours.findMany({
      where: {
        tutorId: tutor.id
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        tutor: {
          include: {
            user: true
          }
        },
        sessions: {
          orderBy: {
            actualStartTime: 'desc'
          },
          take: 1
        },
        payments: true
      }
    })

    // Get tutor's hourly rate
    const hourlyRate = tutor?.hourlyRate ? parseFloat(tutor.hourlyRate.toString()) : 50

    // Transform data into student summaries
    const students = lectureHours.map(lh => {
      const totalHours = parseFloat(lh.totalHours.toString())
      const unpaidHours = parseFloat(lh.unpaidHours.toString())
      const totalEarnings = totalHours * hourlyRate
      const unpaidEarnings = unpaidHours * hourlyRate
      
      // Determine payment status
      let paymentStatus: 'up-to-date' | 'payment-due' | 'overdue'
      const paymentInterval = lh.paymentInterval
      
      if (unpaidHours === 0) {
        paymentStatus = 'up-to-date'
      } else if (unpaidHours >= paymentInterval) {
        paymentStatus = 'overdue'
      } else if (unpaidHours >= paymentInterval - 2) { // Due soon (within 2 hours)
        paymentStatus = 'payment-due'
      } else {
        paymentStatus = 'up-to-date'
      }

      return {
        studentId: lh.studentId,
        studentName: `${lh.student.user.firstName} ${lh.student.user.lastName}`,
        email: lh.student.user.email,
        totalHours,
        unpaidHours,
        totalEarnings,
        unpaidEarnings,
        lastSession: lh.sessions[0]?.actualStartTime,
        paymentStatus,
        paymentInterval
      }
    })

    // Sort by unpaid hours (descending) so students who need payment appear first
    students.sort((a, b) => b.unpaidHours - a.unpaidHours)

    return NextResponse.json({ students })

  } catch (error) {
    console.error('Student summary error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student summary' },
      { status: 500 }
    )
  }
}