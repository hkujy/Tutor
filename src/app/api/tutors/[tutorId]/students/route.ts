import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '../../../../../lib/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tutorId } = await params

    // Verify the user is the tutor or an admin
    if (session.user.role !== 'ADMIN' && session.user.tutorId !== tutorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all students who have had appointments with this tutor
    const students = await db.student.findMany({
      where: {
        appointments: {
          some: {
            tutorId: tutorId
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        appointments: {
          where: {
            tutorId: tutorId
          },
          orderBy: {
            startTime: 'desc'
          },
          take: 1,
          select: {
            subject: true,
            startTime: true,
            status: true
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    })

    // Transform the data to include subjects from appointments
    const studentsWithSubjects = students.map(student => {
      // Get unique subjects from all appointments with this tutor
      const subjectsQuery = db.appointment.findMany({
        where: {
          studentId: student.id,
          tutorId: tutorId
        },
        select: {
          subject: true
        },
        distinct: ['subject']
      })

      return {
        ...student,
        subjects: student.subjects || [], // Use existing subjects or empty array
        lastAppointment: student.appointments[0] || null
      }
    })

    // Get unique subjects for each student
    const studentsWithUniqueSubjects = await Promise.all(
      studentsWithSubjects.map(async (student) => {
        const appointments = await db.appointment.findMany({
          where: {
            studentId: student.id,
            tutorId: tutorId
          },
          select: {
            subject: true
          },
          distinct: ['subject']
        })

        return {
          ...student,
          subjects: appointments.map(apt => apt.subject)
        }
      })
    )

    return NextResponse.json({ 
      students: studentsWithUniqueSubjects,
      count: studentsWithUniqueSubjects.length 
    })

  } catch (error) {
    console.error('Error fetching tutor students:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}