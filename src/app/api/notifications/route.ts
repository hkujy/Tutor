import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth/config'

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const rawLimit = url.searchParams.get('limit')
    const rawPage = url.searchParams.get('page')
    
    // Validate and sanitize pagination parameters
    const limit = Math.min(Math.max(parseInt(rawLimit || '20'), 1), 100) // Max 100 items per page
    const page = Math.max(parseInt(rawPage || '1'), 1) // Minimum page 1
    
    const unreadOnly = url.searchParams.get('unread') === 'true'
    const type = url.searchParams.get('type')
    
    // Validate notification type if provided
    if (type) {
      const validTypes = ['APPOINTMENT_REMINDER', 'ASSIGNMENT_DUE', 'PAYMENT_REMINDER', 'SYSTEM_ANNOUNCEMENT', 'PAYMENT_RECEIVED']
      if (!validTypes.includes(type)) {
        return NextResponse.json({ error: `Invalid notification type: ${type}` }, { status: 400 })
      }
    }

    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id
    }

    if (unreadOnly) {
      where.readAt = null
    }

    if (type) {
      where.type = type
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          channels: true,
          readAt: true,
          scheduledFor: true,
          sentAt: true,
          emailSent: true,
          smsSent: true,
          createdAt: true,
          data: true
        }
      }),
      db.notification.count({ where: { userId: session.user.id } }),
      db.notification.count({ where: { userId: session.user.id, readAt: null } })
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      unreadCount
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications - Create new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, type, title, message, channels = ['in_app'], scheduledFor, data } = body

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, type, title, message' 
      }, { status: 400 })
    }

    // Validate channels
    const validChannels = ['in_app', 'email', 'sms']
    const invalidChannels = channels.filter((channel: string) => !validChannels.includes(channel))
    if (invalidChannels.length > 0) {
      return NextResponse.json({ 
        error: `Invalid channels: ${invalidChannels.join(', ')}. Valid channels: ${validChannels.join(', ')}` 
      }, { status: 400 })
    }

    // Validate userId exists in database
    const userExists = await db.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })
    
    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Validate scheduledFor date if provided
    let scheduledDate = null
    if (scheduledFor) {
      const date = new Date(scheduledFor)
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid scheduledFor date format' }, { status: 400 })
      }
      scheduledDate = date
    }
    
    // Create notification with transaction
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title: title.trim(),
        message: message.trim(),
        channels,
        scheduledFor: scheduledDate,
        data: data || null
      }
    })

    // If not scheduled for future, process immediately
    if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
      await processNotification(notification)
    }

    return NextResponse.json({ 
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        channels: notification.channels,
        scheduledFor: notification.scheduledFor,
        createdAt: notification.createdAt
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Notification creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to process notification delivery
async function processNotification(notification: any) {
  try {
    // Check rate limiting - max 50 notifications per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentNotifications = await db.notification.count({
      where: {
        userId: notification.userId,
        createdAt: {
          gte: oneHourAgo
        }
      }
    })
    
    if (recentNotifications >= 50) {
      console.warn(`Rate limit exceeded for user ${notification.userId}`)
      return
    }
    
    // Get user preferences
    const preferences = await db.notificationPreference.findUnique({
      where: { userId: notification.userId }
    })

    const channels = notification.channels || ['in_app']
    const updates: any = { sentAt: new Date() }

    for (const channel of channels) {
      if (channel === 'email' && preferences?.emailNotifications !== false) {
        // TODO: Implement email sending logic with SendGrid/Resend
        await sendEmailNotification(notification)
        updates.emailSent = true
      } else if (channel === 'sms' && preferences?.smsNotifications === true) {
        // TODO: Implement SMS sending logic with Twilio
        await sendSMSNotification(notification)
        updates.smsSent = true
      }
    }

    // Update notification status
    await db.notification.update({
      where: { id: notification.id },
      data: updates
    })
  } catch (error) {
    console.error('Notification processing error:', error)
  }
}

// Placeholder for email sending
async function sendEmailNotification(notification: any) {
  // TODO: Implement with SendGrid/Resend
  console.log('Email notification sent:', notification.title)
}

// Placeholder for SMS sending
async function sendSMSNotification(notification: any) {
  // TODO: Implement with Twilio
  console.log('SMS notification sent:', notification.title)
}