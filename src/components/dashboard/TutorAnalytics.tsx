'use client'

import React, { useState, useEffect } from 'react'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { Skeleton } from '../ui/Skeleton'

interface TutorAnalyticsProps {
  tutorId: string
}

interface WeeklyData {
  day: string
  sessions: number
  hours: number
  earnings: number
}

interface PerformanceMetric {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: string
  description?: string
}

interface MonthlyEarning {
  month: string
  earnings: number
  hours: number
  sessions: number
}

interface StudentProgress {
  studentName: string
  subject: string
  totalHours: number
  recentSessions: number
  averageRating?: number
  progressTrend: 'improving' | 'stable' | 'declining'
}

interface TimeDistribution {
  timeSlot: string
  sessions: number
  percentage: number
}

interface SubjectPerformance {
  subject: string
  totalSessions: number
  totalHours: number
  totalEarnings: number
  averageSessionLength: number
  studentCount: number
}

export default function TutorAnalytics({ tutorId }: TutorAnalyticsProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([])
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([])
  const [timeDistribution, setTimeDistribution] = useState<TimeDistribution[]>([])
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'subjects' | 'schedule'>('overview')

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
        setMonthlyEarnings(data.monthlyEarnings || [])
        setStudentProgress(data.studentProgress || [])
        setTimeDistribution(data.timeDistribution || [])
        setSubjectPerformance(data.subjectPerformance || [])
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

  const getProgressTrendColor = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return 'text-green-600'
      case 'declining': return 'text-red-600'
      case 'stable': return 'text-blue-600'
    }
  }

  const getProgressTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return '🚀'
      case 'declining': return '⚠️'
      case 'stable': return '✅'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const maxSessions = Math.max(...weeklyData.map(d => d.sessions), 1)
  const maxHours = Math.max(...weeklyData.map(d => d.hours), 1)
  const maxEarnings = Math.max(...weeklyData.map(d => d.earnings), 1)

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
    <div className="bg-white rounded-lg shadow">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h3>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months</option>
            <option value="365d">Last Year</option>
          </select>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'students', label: 'Students', icon: '👥' },
            { id: 'subjects', label: 'Subjects', icon: '📚' },
            { id: 'schedule', label: 'Schedule', icon: '⏰' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 pb-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.map((metric, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{metric.icon}</span>
                    <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                      {getTrendIcon(metric.trend)} {metric.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                  {metric.description && (
                    <div className="text-xs text-gray-500 mt-1">{metric.description}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Enhanced Weekly Activity Chart */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Weekly Activity</h4>
              <div className="grid grid-cols-7 gap-2">
                {weeklyData.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-sm font-medium text-gray-600 mb-2">{day.day}</div>
                    
                    {/* Sessions Bar */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Sessions</div>
                      <div className="h-20 bg-gray-100 rounded relative">
                        <div 
                          className="absolute bottom-0 w-full bg-blue-500 rounded"
                          style={{ height: `${(day.sessions / maxSessions) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                          {day.sessions}
                        </div>
                      </div>
                    </div>

                    {/* Hours Bar */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Hours</div>
                      <div className="h-16 bg-gray-100 rounded relative">
                        <div 
                          className="absolute bottom-0 w-full bg-green-500 rounded"
                          style={{ height: `${(day.hours / maxHours) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                          {day.hours.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* Earnings Bar */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Earnings</div>
                      <div className="h-16 bg-gray-100 rounded relative">
                        <div 
                          className="absolute bottom-0 w-full bg-purple-500 rounded"
                          style={{ height: `${(day.earnings / maxEarnings) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                          ${day.earnings}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Earnings Trend */}
            {monthlyEarnings.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Monthly Earnings Trend</h4>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {monthlyEarnings.map((month, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg text-center">
                      <div className="text-sm font-medium text-gray-600 mb-2">{month.month}</div>
                      <div className="text-xl font-bold text-green-600 mb-1">
                        {formatCurrency(month.earnings)}
                      </div>
                      <div className="text-xs text-gray-500">{month.hours}h • {month.sessions} sessions</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900">Student Progress Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentProgress.map((student, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-900">{student.studentName}</div>
                      <div className="text-sm text-gray-600">{student.subject}</div>
                    </div>
                    <div className={`flex items-center space-x-1 ${getProgressTrendColor(student.progressTrend)}`}>
                      <span>{getProgressTrendIcon(student.progressTrend)}</span>
                      <span className="text-sm font-medium">{student.progressTrend}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Hours:</span>
                      <span className="font-medium">{student.totalHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recent Sessions:</span>
                      <span className="font-medium">{student.recentSessions}</span>
                    </div>
                    {student.averageRating && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Rating:</span>
                        <span className="font-medium">{student.averageRating}/5 ⭐</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900">Subject Performance Analysis</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subjectPerformance.map((subject, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{subject.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.studentCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.totalSessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.totalHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.averageSessionLength.toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(subject.totalEarnings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900">Schedule Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Distribution */}
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-4">Most Active Time Slots</h5>
                <div className="space-y-3">
                  {timeDistribution.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-20 text-sm font-medium text-gray-700">{slot.timeSlot}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${slot.percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-gray-600">{slot.sessions}</div>
                      <div className="w-12 text-xs text-gray-500">{slot.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule Insights */}
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-4">Schedule Insights</h5>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Peak Hours</div>
                    <div className="text-sm text-blue-700">
                      {timeDistribution.length > 0 && timeDistribution[0]?.timeSlot} is your busiest time slot
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm font-medium text-green-900">Availability Optimization</div>
                    <div className="text-sm text-green-700">
                      Consider adding more slots during high-demand periods
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-yellow-900">Work-Life Balance</div>
                    <div className="text-sm text-yellow-700">
                      {weeklyData.reduce((sum, day) => sum + day.hours, 0).toFixed(1)} hours this week
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}