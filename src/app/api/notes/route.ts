import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth/config'
import { z } from 'zod'

const createNoteSchema = z.object({
  studentId: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.enum(['GENERAL', 'SESSION_FEEDBACK', 'PROGRESS_UPDATE', 'BEHAVIORAL', 'ACADEMIC_CONCERN', 'ACHIEVEMENT', 'PARENT_COMMUNICATION', 'HOMEWORK_REMINDER']).optional().default('GENERAL'),
  isPrivate: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  sessionDate: z.string().optional(), // ISO date string
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
})

const updateNoteSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(['GENERAL', 'SESSION_FEEDBACK', 'PROGRESS_UPDATE', 'BEHAVIORAL', 'ACADEMIC_CONCERN', 'ACHIEVEMENT', 'PARENT_COMMUNICATION', 'HOMEWORK_REMINDER']).optional(),
  isPrivate: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sessionDate: z.string().optional(), // ISO date string
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const tutorId = searchParams.get('tutorId')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const isPrivate = searchParams.get('isPrivate')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Build where clause
    const where: any = {}
    
    if (studentId) {
      where.studentId = studentId
    }
    
    if (tutorId) {
      where.tutorId = tutorId
    }
    
    if (type) {
      where.type = type
    }
    
    if (priority) {
      where.priority = priority
    }
    
    if (isPrivate !== null) {
      where.isPrivate = isPrivate === 'true'
    }

    // For students, only show notes that are not private or are their own
    if (session.user.role === 'STUDENT') {
      where.OR = [
        { isPrivate: false },
        { studentId: session.user.studentId }
      ]
    }

    // For tutors, show all notes for their students
    if (session.user.role === 'TUTOR' && !studentId) {
      // Get all students for this tutor
      const tutorStudents = await db.appointment.findMany({
        where: { tutorId: session.user.tutorId },
        select: { studentId: true },
        distinct: ['studentId']
      })
      
      where.studentId = {
        in: tutorStudents.map(a => a.studentId)
      }
    }

    const notes = await db.studentNote.findMany({
      where,
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
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    })

    return NextResponse.json({
      notes,
      total: notes.length
    })

  } catch (error) {
    console.error('Error fetching student notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TUTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createNoteSchema.parse(body)

    // Verify tutor has access to this student
    const hasAccess = await db.appointment.findFirst({
      where: {
        tutorId: session.user.tutorId,
        studentId: validatedData.studentId
      }
    })

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to create notes for this student' },
        { status: 403 }
      )
    }

    const note = await db.studentNote.create({
      data: {
        ...validatedData,
        tutorId: session.user.tutorId!,
        sessionDate: validatedData.sessionDate ? new Date(validatedData.sessionDate) : null,
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
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Create notification for high/urgent priority notes
    if (['HIGH', 'URGENT'].includes(validatedData.priority)) {
      await db.notification.create({
        data: {
          userId: validatedData.studentId,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: `New ${validatedData.priority.toLowerCase()} priority note`,
          message: `Your tutor has added a ${validatedData.priority.toLowerCase()} priority note: ${validatedData.title}`,
          channels: ['email']
        }
      })
    }

    return NextResponse.json({ note }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating student note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TUTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateNoteSchema.parse(body)

    // Verify tutor owns this note
    const existingNote = await db.studentNote.findUnique({
      where: { id: validatedData.id },
      include: { student: true }
    })

    if (!existingNote || existingNote.tutorId !== session.user.tutorId) {
      return NextResponse.json(
        { error: 'Note not found or unauthorized' },
        { status: 404 }
      )
    }

    const updateData: any = { ...validatedData }
    delete updateData.id
    
    if (validatedData.sessionDate) {
      updateData.sessionDate = new Date(validatedData.sessionDate)
    }

    const note = await db.studentNote.update({
      where: { id: validatedData.id },
      data: updateData,
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
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ note })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating student note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TUTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('id')

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    // Verify tutor owns this note
    const existingNote = await db.studentNote.findUnique({
      where: { id: noteId }
    })

    if (!existingNote || existingNote.tutorId !== session.user.tutorId) {
      return NextResponse.json(
        { error: 'Note not found or unauthorized' },
        { status: 404 }
      )
    }

    await db.studentNote.delete({
      where: { id: noteId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting student note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}