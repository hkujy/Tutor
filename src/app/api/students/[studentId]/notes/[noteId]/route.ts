import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { studentId: string, noteId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteId } = params

    // Only tutors can update student notes
    if (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only tutors can update student notes' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, type, priority, isPrivate, tags, sessionDate } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Update the note
    const note = await prisma.studentNote.update({
      where: { id: noteId },
      data: {
        title,
        content,
        type: type || 'GENERAL',
        priority: priority || 'NORMAL',
        isPrivate: isPrivate || false,
        tags: tags || [],
        sessionDate: sessionDate ? new Date(sessionDate) : null,
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
    console.error('Error updating student note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { studentId: string, noteId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteId } = params

    // Only tutors can delete student notes
    if (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only tutors can delete student notes' }, { status: 403 })
    }

    // Delete the note
    await prisma.studentNote.delete({
      where: { id: noteId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}