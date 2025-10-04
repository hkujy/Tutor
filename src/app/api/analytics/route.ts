import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'
import { format, startOfWeek, endOfWeek, subDays, subWeeks, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const tutorId = url.searchParams.get('tutorId')
    const period = url.searchParams.get('period') || '7d'

    if (!tutorId) {
      return NextResponse.json({ error: 'Tutor ID is required' }, { status: 400 })
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

    // Get performance metrics
    const [
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalStudents,
      recentAppointments,
      availabilitySlots
    ] = await Promise.all([
      // Total sessions in period
      db.appointment.count({
        where: {
          tutorId,
          startTime: { gte: startDate, lte: endDate }
        }
      }),
      // Completed sessions
      db.appointment.count({
        where: {
          tutorId,
          startTime: { gte: startDate, lte: endDate },
          status: 'COMPLETED'
        }
      }),
      // Upcoming sessions
      db.appointment.count({
        where: {
          tutorId,
          startTime: { gte: now },
          status: { in: ['SCHEDULED', 'CONFIRMED'] }
        }
      }),
      // Unique students
      db.appointment.findMany({
        where: {
          tutorId,
          startTime: { gte: startDate, lte: endDate }
        },
        select: { studentId: true },
        distinct: ['studentId']
      }),
      // Recent appointments for activity
      db.appointment.findMany({
        where: {
          tutorId,
          startTime: { gte: startDate, lte: endDate }
        },
        orderBy: { startTime: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        }
      }),
      // Available slots
      db.availability.count({
        where: { tutorId, isActive: true }
      })
    ])

    // Calculate metrics
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
    const responseTime = '<2 hours' // Mock for now
    const avgRating = 4.8 // Mock for now
    const repeatBookingRate = 87 // Mock for now

    // Generate weekly activity data
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    const weeklyActivity = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      
      const dayAppointments = recentAppointments.filter(apt => {
        const aptDate = new Date(apt.startTime)
        return aptDate.toDateString() === date.toDateString()
      })

      weeklyActivity.push({
        day: format(date, 'EEE'),
        sessions: dayAppointments.length,
        hours: dayAppointments.length * 1 // Assuming 1 hour per session
      })
    }

    // Subject performance - group by subject
    const subjectStats = recentAppointments.reduce((acc: any, apt) => {
      const subject = apt.subject || 'General'
      if (!acc[subject]) {
        acc[subject] = {
          subject,
          sessions: 0,
          students: new Set(),
          rating: avgRating
        }
      }
      acc[subject].sessions++
      acc[subject].students.add(apt.studentId)
      return acc
    }, {})

    const subjectPerformance = Object.values(subjectStats).map((stats: any) => ({
      subject: stats.subject,
      sessions: stats.sessions,
      students: stats.students.size,
      rating: stats.rating
    }))

    // Calculate earnings (mock calculation)
    const avgHourlyRate = 60 // Mock rate
    const totalEarnings = completedSessions * avgHourlyRate
    const avgPerSession = completedSessions > 0 ? totalEarnings / completedSessions : 0

    return NextResponse.json({
      metrics: [
        {
          label: 'Student Satisfaction',
          value: `${avgRating}/5.0`,
          change: '+0.1',
          trend: 'up',
          icon: '⭐'
        },
        {
          label: 'Response Time',
          value: responseTime,
          change: '-30 min',
          trend: 'up',
          icon: '⚡'
        },
        {
          label: 'Session Completion',
          value: `${completionRate}%`,
          change: '+2%',
          trend: 'up',
          icon: '✅'
        },
        {
          label: 'Repeat Bookings',
          value: `${repeatBookingRate}%`,
          change: '+5%',
          trend: 'up',
          icon: '🔄'
        }
      ],
      weeklyActivity,
      subjectPerformance,
      earnings: {
        total: totalEarnings,
        averagePerSession: Math.round(avgPerSession),
        totalSessions: completedSessions
      },
      summary: {
        totalSessions,
        completedSessions,
        upcomingSessions,
        totalStudents: totalStudents.length,
        availabilitySlots
      }
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}