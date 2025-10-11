import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tutorId } = await params
    const body = await request.json()
    const { studentId, hours, date, subject, description, hourlyRate } = body

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

    // Verify the student exists
    const student = await db.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const totalAmount = hours * hourlyRate

    // Find or create lecture hours record for this student-tutor-subject combination
    let lectureHours = await db.lectureHours.findFirst({
      where: {
        studentId: studentId,
        tutorId: tutor.id,
        subject: subject
      }
    })

    if (!lectureHours) {
      // Create new lecture hours record
      lectureHours = await db.lectureHours.create({
        data: {
          studentId: studentId,
          tutorId: tutor.id,
          subject: subject,
          totalHours: hours,
          unpaidHours: hours,
          lastSessionDate: new Date(date)
        }
      })
    } else {
      // Update existing lecture hours record
      await db.lectureHours.update({
        where: { id: lectureHours.id },
        data: {
          totalHours: { increment: hours },
          unpaidHours: { increment: hours },
          lastSessionDate: new Date(date)
        }
      })
    }

    // Create a lecture session record (but we need an appointment first)
    // For manual entries, we might skip this or create a minimal appointment
    // For now, let's just update the lecture hours without creating a session
    
    // If you want to track individual sessions, you'd need to create an appointment first
    // or modify the schema to allow lecture sessions without appointments

    // Create audit log entry
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        resource: 'lecture_hours',
        resourceId: lectureHours.id,
        details: {
          studentId,
          hours,
          date,
          subject,
          description,
          hourlyRate,
          totalAmount
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true,
      lectureHoursId: lectureHours.id,
      totalAmount 
    })
  } catch (error) {
    console.error('Error adding lecture hours:', error)
    return NextResponse.json(
      { error: 'Failed to add lecture hours' },
      { status: 500 }
    )
  }
}