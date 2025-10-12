import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentId } = params

    // Only tutors can view student notes
    if (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only tutors can view student notes' }, { status: 403 })
    }

    // Fetch notes for this student
    const notes = await prisma.studentNote.findMany({
      where: {
        studentId: studentId
      },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error fetching student notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentId } = params

    // Only tutors can create student notes
    if (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only tutors can create student notes' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, type, priority, isPrivate, tags, sessionDate, tutorId } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Get tutor record
    const tutor = await prisma.tutor.findFirst({
      where: {
        userId: session.user.id
      }
    })

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    // Create the note
    const note = await prisma.studentNote.create({
      data: {
        title,
        content,
        type: type || 'GENERAL',
        priority: priority || 'NORMAL',
        isPrivate: isPrivate || false,
        tags: tags || [],
        sessionDate: sessionDate ? new Date(sessionDate) : null,
        studentId,
        tutorId: tutor.id
      },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Error creating student note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}