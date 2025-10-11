import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db/client'

export async function PUT(
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

    // Find the student
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Update user information if provided
    if (body.studentName || body.email) {
      const [firstName, ...lastNameParts] = (body.studentName || student.user.firstName + ' ' + student.user.lastName).split(' ')
      const lastName = lastNameParts.join(' ') || ''

      await db.user.update({
        where: { id: student.userId },
        data: {
          ...(body.studentName && { firstName, lastName }),
          ...(body.email && { email: body.email })
        }
      })
    }

    // Update student-specific data
    const updateData: any = {}
    if (body.paymentInterval !== undefined) {
      updateData.paymentInterval = body.paymentInterval
    }

    if (Object.keys(updateData).length > 0) {
      await db.student.update({
        where: { id: studentId },
        data: updateData
      })
    }

    // Handle payment status and financial adjustments
    if (body.paymentStatus || body.unpaidHours !== undefined || body.unpaidEarnings !== undefined) {
      // Update the lecture hours record for this student-tutor pair
      const lectureHours = await db.lectureHours.findFirst({
        where: {
          studentId: studentId,
          tutorId: tutor.id
        }
      })

      if (lectureHours && (body.unpaidHours !== undefined || body.unpaidEarnings !== undefined)) {
        await db.lectureHours.update({
          where: { id: lectureHours.id },
          data: {
            unpaidHours: body.unpaidHours !== undefined ? body.unpaidHours : lectureHours.unpaidHours,
            paymentInterval: body.paymentInterval !== undefined ? body.paymentInterval : lectureHours.paymentInterval
          }
        })
      }
    }

    // Create audit log entry
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_STUDENT',
        resource: 'student',
        resourceId: studentId,
        details: {
          oldValues: {
            name: student.user.firstName + ' ' + student.user.lastName,
            email: student.user.email
          },
          newValues: body,
          reason: body.adjustmentReason || 'Manual update by tutor'
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}