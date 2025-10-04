'use client'

import React, { useState, useEffect } from 'react'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { Skeleton } from '../ui/Skeleton'

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
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  useEffect(() => {
    setIsHydrated(true)
    fetchAnalytics()
  }, [tutorId, selectedPeriod])

  const fetchAnalytics = async () => {
    if (!tutorId) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?tutorId=${tutorId}&period=${selectedPeriod}`)
      if (res.ok) {
        const data = await res.json()
        setAnalyticsData(data)
        setMetrics(data.metrics || [])
        setWeeklyData(data.weeklyActivity || [])
      } else {
        console.error('Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Analytics fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="flex items-center justify-between mb-6">
          <Skeleton width={200} height={24} className="bg-gray-300" />
          <Skeleton width={120} height={36} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Skeleton width={24} height={24} variant="circular" />
                <Skeleton width={60} height={16} />
              </div>
              <Skeleton width={60} height={28} className="mb-1" />
              <Skeleton width={100} height={16} />
            </div>
          ))}
        </div>
        <Skeleton width="100%" height={200} className="mb-6" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} width="100%" height={60} />
          ))}
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
          {analyticsData?.subjectPerformance?.length > 0 ? (
            analyticsData.subjectPerformance.map((item: any, index: number) => (
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
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              No subject data available yet
            </div>
          )}
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-3">Earnings Summary (This Month)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${analyticsData?.earnings?.total || 0}
            </div>
            <div className="text-green-700">Total Earnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${analyticsData?.earnings?.averagePerSession || 0}
            </div>
            <div className="text-green-700">Average per Session</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analyticsData?.earnings?.totalSessions || 0}
            </div>
            <div className="text-green-700">Total Sessions</div>
          </div>
        </div>
      </div>
    </div>
  )
}