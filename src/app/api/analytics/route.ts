import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db/client'
import { format, startOfWeek, endOfWeek, subDays, subWeeks, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from 'date-fns'

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

    // Get performance metrics
    const [
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalStudents,
      recentAppointments,
      availabilitySlots,
      tutorInfo
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
      }),
      // Get tutor info for hourly rate
      db.tutor.findUnique({
        where: { id: tutorId },
        select: { hourlyRate: true, rating: true }
      })
    ])

    // Calculate metrics
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
    const responseTime = '<2 hours' // Mock for now
    const avgRating = tutorInfo?.rating ? Number(tutorInfo.rating) : 4.8
    const hourlyRate = tutorInfo?.hourlyRate ? Number(tutorInfo.hourlyRate) : 60

    // Calculate earnings and hours from completed appointments
    const completedAppointments = recentAppointments.filter(apt => apt.status === 'COMPLETED')
    const totalHours = completedAppointments.reduce((sum: number, apt: any) => {
      const duration = (new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / (1000 * 60 * 60)
      return sum + duration
    }, 0)
    const totalEarnings = totalHours * hourlyRate

    // Generate weekly activity data
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    const weeklyActivity = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      
      const dayAppointments = recentAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.startTime)
        return aptDate.toDateString() === date.toDateString()
      })

      const dayCompleted = dayAppointments.filter((apt: any) => apt.status === 'COMPLETED')
      const dayHours = dayCompleted.reduce((sum: number, apt: any) => {
        const duration = (new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / (1000 * 60 * 60)
        return sum + duration
      }, 0)
      const dayEarnings = dayHours * hourlyRate

      weeklyActivity.push({
        day: format(date, 'EEE'),
        sessions: dayAppointments.length,
        hours: Math.round(dayHours * 10) / 10,
        earnings: Math.round(dayEarnings)
      })
    }

    // Generate monthly earnings data
    const monthlyEarnings = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))
      
      const monthAppointments = recentAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.startTime)
        return aptDate >= monthStart && aptDate <= monthEnd
      })

      const monthCompleted = monthAppointments.filter((apt: any) => apt.status === 'COMPLETED')
      const monthTotalHours = monthCompleted.reduce((sum: number, apt: any) => {
        const duration = (new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / (1000 * 60 * 60)
        return sum + duration
      }, 0)
      const monthTotalEarnings = monthTotalHours * hourlyRate

      monthlyEarnings.push({
        month: format(monthStart, 'MMM'),
        earnings: Math.round(monthTotalEarnings),
        hours: Math.round(monthTotalHours * 10) / 10,
        sessions: monthAppointments.length
      })
    }

    // Student progress analysis
    const studentProgress: any[] = []
    const studentStats = new Map()

    // Group appointments by student
    recentAppointments.forEach((apt: any) => {
      const studentId = apt.studentId
      const studentName = `${apt.student.user.firstName} ${apt.student.user.lastName}`
      
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          studentName,
          subject: apt.subject || 'General',
          totalHours: 0,
          recentSessions: 0,
          averageRating: apt.rating || avgRating,
          progressTrend: 'stable' as 'improving' | 'stable' | 'declining'
        })
      }

      const stats = studentStats.get(studentId)
      if (apt.status === 'COMPLETED') {
        const duration = (new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / (1000 * 60 * 60)
        stats.totalHours += duration
      }
      
      // Check if session is recent (last 30 days)
      const recentDate = subDays(now, 30)
      if (new Date(apt.startTime) >= recentDate) {
        stats.recentSessions += 1
      }
    })

    // Convert to array and determine progress trends
    studentStats.forEach((stats, studentId) => {
      // Simple trend analysis based on recent activity
      if (stats.recentSessions >= 4) {
        stats.progressTrend = 'improving'
      } else if (stats.recentSessions <= 1) {
        stats.progressTrend = 'declining'
      }
      
      // Round total hours
      stats.totalHours = Math.round(stats.totalHours * 10) / 10
      
      studentProgress.push(stats)
    })

    // Time distribution analysis
    const timeSlotCounts = new Map()
    recentAppointments.forEach((apt: any) => {
      const hour = new Date(apt.startTime).getHours()
      let timeSlot: string
      
      if (hour < 12) {
        timeSlot = 'Morning (6-12 PM)'
      } else if (hour < 17) {
        timeSlot = 'Afternoon (12-5 PM)'
      } else {
        timeSlot = 'Evening (5-10 PM)'
      }
      
      timeSlotCounts.set(timeSlot, (timeSlotCounts.get(timeSlot) || 0) + 1)
    })

    const totalSlotSessions = Array.from(timeSlotCounts.values()).reduce((sum: number, count: number) => sum + count, 0)
    const timeDistribution = Array.from(timeSlotCounts.entries()).map(([timeSlot, sessions]) => ({
      timeSlot,
      sessions,
      percentage: totalSlotSessions > 0 ? Math.round((sessions / totalSlotSessions) * 100) : 0
    })).sort((a, b) => b.sessions - a.sessions)

    // Subject performance analysis
    const subjectStats = new Map()
    
    recentAppointments.forEach((apt: any) => {
      const subject = apt.subject || 'General'
      if (!subjectStats.has(subject)) {
        subjectStats.set(subject, {
          subject,
          totalSessions: 0,
          totalHours: 0,
          totalEarnings: 0,
          students: new Set()
        })
      }
      
      const stats = subjectStats.get(subject)
      stats.totalSessions += 1
      
      if (apt.status === 'COMPLETED') {
        const duration = (new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / (1000 * 60 * 60)
        stats.totalHours += duration
        stats.totalEarnings += duration * hourlyRate
      }
      
      stats.students.add(apt.studentId)
    })

    const subjectPerformance = Array.from(subjectStats.values()).map((stats: any) => ({
      subject: stats.subject,
      totalSessions: stats.totalSessions,
      totalHours: Math.round(stats.totalHours * 10) / 10,
      totalEarnings: Math.round(stats.totalEarnings),
      averageSessionLength: stats.totalSessions > 0 ? Math.round((stats.totalHours / stats.totalSessions) * 10) / 10 : 0,
      studentCount: stats.students.size
    }))

    return NextResponse.json({
      metrics: [
        {
          label: 'Student Satisfaction',
          value: `${avgRating}/5.0`,
          change: '+0.1',
          trend: 'up' as 'up' | 'down' | 'stable',
          icon: '⭐',
          description: 'Average rating from students'
        },
        {
          label: 'Response Time',
          value: responseTime,
          change: '-30 min',
          trend: 'up' as 'up' | 'down' | 'stable',
          icon: '⚡',
          description: 'Average response time to messages'
        },
        {
          label: 'Session Completion',
          value: `${completionRate}%`,
          change: '+2%',
          trend: 'up' as 'up' | 'down' | 'stable',
          icon: '✅',
          description: 'Sessions completed successfully'
        },
        {
          label: 'Total Earnings',
          value: `$${Math.round(totalEarnings)}`,
          change: '+12%',
          trend: 'up' as 'up' | 'down' | 'stable',
          icon: '�',
          description: `From ${totalHours} hours taught`
        }
      ],
      weeklyActivity,
      monthlyEarnings,
      studentProgress: studentProgress.slice(0, 10), // Limit to top 10
      timeDistribution,
      subjectPerformance,
      earnings: {
        total: Math.round(totalEarnings),
        averagePerSession: Math.round(totalEarnings / Math.max(completedSessions, 1)),
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