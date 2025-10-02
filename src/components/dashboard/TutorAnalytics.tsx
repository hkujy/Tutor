'use client'

import React, { useState, useEffect } from 'react'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

interface TutorAnalyticsProps {
  tutorId: string
}

interface WeeklyData {
  day: string
  sessions: number
  hours: number
}

interface PerformanceMetric {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: string
}

interface MonthlyEarning {
  month: string
  earnings: number
}

export default function TutorAnalytics({ tutorId }: TutorAnalyticsProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  useEffect(() => {
    // Generate mock data after hydration to avoid SSR mismatch
    const today = new Date()
    const weekStart = startOfWeek(today)
    const weekEnd = endOfWeek(today)
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    // Use deterministic values based on day index instead of random
    const mockWeeklyData: WeeklyData[] = weekDays.map((day, index) => ({
      day: format(day, 'EEE'),
      sessions: (index % 4) + 1, // Deterministic: 1, 2, 3, 4, 1, 2, 3
      hours: ((index * 2) % 7) + 2 // Deterministic: 2, 4, 6, 8, 3, 5, 7
    }))

    setWeeklyData(mockWeeklyData)
    setIsHydrated(true)

    const mockMetrics: PerformanceMetric[] = [
      {
        label: 'Student Satisfaction',
        value: '4.9/5.0',
        change: '+0.1',
        trend: 'up',
        icon: '⭐'
      },
      {
        label: 'Response Time',
        value: '< 2 hours',
        change: '-30 min',
        trend: 'up',
        icon: '⚡'
      },
      {
        label: 'Session Completion',
        value: '98%',
        change: '+2%',
        trend: 'up',
        icon: '✅'
      },
      {
        label: 'Repeat Bookings',
        value: '87%',
        change: '+5%',
        trend: 'up',
        icon: '🔄'
      }
    ]

    setTimeout(() => {
      setWeeklyData(mockWeeklyData)
      setMetrics(mockMetrics)
      setLoading(false)
    }, 1000)
  }, [tutorId, selectedPeriod])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      case 'stable': return 'text-gray-600'
    }
  }

  const maxSessions = Math.max(...weeklyData.map(d => d.sessions))
  const maxHours = Math.max(...weeklyData.map(d => d.hours))

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Performance Analytics</h3>
        <select 
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{metric.icon}</span>
              <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                {getTrendIcon(metric.trend)} {metric.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
            <div className="text-sm text-gray-600">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly Activity Chart */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Weekly Activity</h4>
        <div className="grid grid-cols-7 gap-2">
          {weeklyData.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-2">{day.day}</div>
              
              {/* Sessions Bar */}
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Sessions</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(day.sessions / maxSessions) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs font-medium text-gray-900">{day.sessions}</div>
              </div>

              {/* Hours Bar */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Hours</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(day.hours / maxHours) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs font-medium text-gray-900">{day.hours}h</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Performance */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Subject Performance</h4>
        <div className="space-y-3">
          {[
            { subject: 'Mathematics', sessions: 15, rating: 4.9, students: 8 },
            { subject: 'Physics', sessions: 12, rating: 4.8, students: 6 },
            { subject: 'Chemistry', sessions: 8, rating: 4.7, students: 4 },
            { subject: 'Biology', sessions: 5, rating: 5.0, students: 3 }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.subject}</div>
                <div className="text-sm text-gray-600">{item.students} students • {item.sessions} sessions</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{item.rating} ⭐</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-3">Earnings Summary (This Month)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">$2,450</div>
            <div className="text-green-700">Total Earnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">$65</div>
            <div className="text-green-700">Average per Session</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">38</div>
            <div className="text-green-700">Total Sessions</div>
          </div>
        </div>
      </div>
    </div>
  )
}