import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../../lib/db/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth/config'

interface RouteParams {
  params: {
    id: string
  }
}

// PATCH /api/notifications/[id]/read - Mark notification as read
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Verify notification belongs to user
    const notification = await db.notification.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Mark as read
    const updatedNotification = await db.notification.update({
      where: { id },
      data: { readAt: new Date() },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        readAt: true,
        createdAt: true
      }
    })

    return NextResponse.json({ notification: updatedNotification })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}