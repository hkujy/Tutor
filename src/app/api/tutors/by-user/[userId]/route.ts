import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params

    // Verify this is the current user or an admin
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Find the tutor record for this user
    const tutor = await db.tutor.findFirst({
      where: {
        userId: userId
      },
      select: {
        id: true
      }
    })

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    return NextResponse.json({ tutorId: tutor.id })
  } catch (error) {
    console.error('Error fetching tutor by user ID:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutor' },
      { status: 500 }
    )
  }
}