import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth/config'

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await db.notificationPreference.findUnique({
      where: { userId: session.user.id },
      select: {
        emailNotifications: true,
        smsNotifications: true,
        reminderTiming: true,
        assignmentReminders: true,
        marketingEmails: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // If no preferences exist, return defaults
    if (!preferences) {
      const defaultPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        reminderTiming: 24,
        assignmentReminders: true,
        marketingEmails: false
      }
      
      // Create default preferences
      const newPreferences = await db.notificationPreference.create({
        data: {
          userId: session.user.id,
          ...defaultPreferences
        },
        select: {
          emailNotifications: true,
          smsNotifications: true,
          reminderTiming: true,
          assignmentReminders: true,
          marketingEmails: true,
          createdAt: true,
          updatedAt: true
        }
      })
      
      return NextResponse.json({ preferences: newPreferences })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notifications/preferences - Update notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      emailNotifications,
      smsNotifications,
      reminderTiming,
      assignmentReminders,
      marketingEmails
    } = body

    // Validate reminderTiming if provided
    if (reminderTiming !== undefined && (reminderTiming < 0 || reminderTiming > 168)) {
      return NextResponse.json({ 
        error: 'Reminder timing must be between 0 and 168 hours' 
      }, { status: 400 })
    }

    // Build update data object
    const updateData: any = {}
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications
    if (smsNotifications !== undefined) updateData.smsNotifications = smsNotifications
    if (reminderTiming !== undefined) updateData.reminderTiming = reminderTiming
    if (assignmentReminders !== undefined) updateData.assignmentReminders = assignmentReminders
    if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update or create preferences
    const preferences = await db.notificationPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        emailNotifications: emailNotifications ?? true,
        smsNotifications: smsNotifications ?? false,
        reminderTiming: reminderTiming ?? 24,
        assignmentReminders: assignmentReminders ?? true,
        marketingEmails: marketingEmails ?? false
      },
      update: updateData,
      select: {
        emailNotifications: true,
        smsNotifications: true,
        reminderTiming: true,
        assignmentReminders: true,
        marketingEmails: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ 
      preferences,
      message: 'Notification preferences updated successfully'
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}