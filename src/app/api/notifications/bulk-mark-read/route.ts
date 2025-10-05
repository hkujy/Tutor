import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth/config'

// POST /api/notifications/bulk-mark-read - Mark multiple notifications as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAllAsRead } = body

    if (markAllAsRead) {
      // Mark all user's notifications as read
      const result = await db.notification.updateMany({
        where: {
          userId: session.user.id,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: `Marked ${result.count} notifications as read`,
        count: result.count
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      if (notificationIds.length === 0) {
        return NextResponse.json({ error: 'No notification IDs provided' }, { status: 400 })
      }

      if (notificationIds.length > 100) {
        return NextResponse.json({ error: 'Cannot mark more than 100 notifications at once' }, { status: 400 })
      }

      const result = await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: `Marked ${result.count} notifications as read`,
        count: result.count
      })
    } else {
      return NextResponse.json({ 
        error: 'Either provide notificationIds array or set markAllAsRead to true' 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Bulk mark read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}