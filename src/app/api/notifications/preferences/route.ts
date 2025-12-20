import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth/config'
import { db } from '../../../../lib/db/client'
import { z } from 'zod'

const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  reminderTiming: z.number().min(1).max(72).optional(), // Hours before
  assignmentReminders: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await db.notificationPreference.findUnique({
      where: { userId: session.user.id }
    })

    if (!preferences) {
      // Return defaults if no record exists
      return NextResponse.json({
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          reminderTiming: 24,
          assignmentReminders: true,
          marketingEmails: false
        }
      })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Fetch preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = preferencesSchema.parse(body)

    const preferences = await db.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        emailNotifications: data.emailNotifications ?? true,
        smsNotifications: data.smsNotifications ?? false,
        reminderTiming: data.reminderTiming ?? 24,
        assignmentReminders: data.assignmentReminders ?? true,
        marketingEmails: data.marketingEmails ?? false,
      }
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Update preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
