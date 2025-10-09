import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'
import { format, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const tutorId = url.searchParams.get('tutorId')
    const period = url.searchParams.get('period') || '7d'

    // Validate required parameters
    if (!tutorId) {
      return NextResponse.json({ error: 'Tutor ID is required' }, { status: 400 })
    }

    // Validate tutorId format (basic validation)
    if (typeof tutorId !== 'string' || tutorId.length === 0) {
      return NextResponse.json({ error: 'Invalid tutor ID format' }, { status: 400 })
    }

    // Validate period parameter
    const validPeriods = ['7d', '30d', '90d', '365d', 'week', 'month']
    if (!validPeriods.includes(period)) {
      return NextResponse.json({ error: `Invalid period. Valid periods: ${validPeriods.join(', ')}` }, { status: 400 })
    }

    // Verify tutor exists
    const tutorExists = await db.user.findFirst({
      where: {
        id: tutorId,
        role: { in: ['TUTOR', 'ADMIN'] }
      },
      select: { id: true }
    })

    if (!tutorExists) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
    }

    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    // Calculate date range based on period
    switch (period) {
      case '7d':
        startDate = subDays(now, 7)
        break
      case '30d':
        startDate = subDays(now, 30)
        break
      case '90d':
        startDate = subDays(now, 90)
        break
      case '365d':
        startDate = subDays(now, 365)
        break
      case 'week':
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      default:
        startDate = subDays(now, 7)
    }

    // Get basic analytics data
    const [totalAppointments, completedAppointments, upcomingAppointments] = await Promise.all([
      // Total appointments in period
      db.appointment.count({
        where: {
          tutorId,
          startTime: { gte: startDate, lte: endDate }
        }
      }),

      // Completed appointments
      db.appointment.count({
        where: {
          tutorId,
          startTime: { gte: startDate, lte: endDate },
          status: 'COMPLETED'
        }
      }),

      // Upcoming appointments
      db.appointment.count({
        where: {
          tutorId,
          startTime: { gte: now },
          status: { in: ['SCHEDULED', 'CONFIRMED'] }
        }
      })
    ])

    // Calculate completion rate
    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0

    const response = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      stats: {
        totalAppointments,
        completedAppointments,
        upcomingAppointments,
        completionRate: Math.round(completionRate * 100) / 100
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}