'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { useTranslations } from 'next-intl'
import { Skeleton } from '../ui/Skeleton'
import ErrorBoundary from '../ErrorBoundary'

// Type guards for data validation
const isValidNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

const isValidString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}

const sanitizeApiData = (data: any) => {
  if (!data || typeof data !== 'object') return null
  
  // Sanitize metrics array
  if (Array.isArray(data.metrics)) {
    data.metrics = data.metrics.filter((metric: any) => 
      metric && 
      isValidString(metric.label) && 
      isValidString(metric.value) &&
      ['up', 'down', 'stable'].includes(metric.trend)
    )
  } else {
    data.metrics = []
  }
  
  // Sanitize weekly data
  if (Array.isArray(data.weeklyActivity)) {
    data.weeklyActivity = data.weeklyActivity.filter((day: any) => 
      day &&
      isValidString(day.day) &&
      isValidNumber(day.sessions) &&
      isValidNumber(day.hours) &&
      isValidNumber(day.earnings) &&
      day.sessions >= 0 &&
      day.hours >= 0 &&
      day.earnings >= 0
    )
  } else {
    data.weeklyActivity = []
  }
  
  // Sanitize other arrays with similar validation
  const arrayFields = ['monthlyEarnings', 'studentProgress', 'timeDistribution', 'subjectPerformance']
  arrayFields.forEach(field => {
    if (!Array.isArray(data[field])) {
      data[field] = []
    }
  })
  
  return data
}

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

function TutorAnalytics({ tutorId }: TutorAnalyticsProps) {
  const t = useTranslations('TutorAnalytics')
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([])
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([])
  const [timeDistribution, setTimeDistribution] = useState<TimeDistribution[]>([])
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'subjects' | 'schedule'>('overview')
  
  // Performance optimization: abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)
  const maxRetries = 3
  const retryDelay = 1000

  // Memoized fetchAnalytics with comprehensive error handling
  const fetchAnalytics = useCallback(async (isRetry = false) => {
    if (!tutorId || !isValidString(tutorId)) {
      setError(t('errors.invalidTutorId'))
      setLoading(false)
      return
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current
    
    if (!isRetry) {
      setLoading(true)
      setError(null)
    }
    
    try {
      // Input validation
      const validPeriods = ['7d', '30d', '90d', '365d']
      const safePeriod = validPeriods.includes(selectedPeriod) ? selectedPeriod : '7d'
      
      const url = `/api/analytics?tutorId=${encodeURIComponent(tutorId)}&period=${safePeriod}`
      
      const response = await fetch(url, {
        signal,
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t('errors.dataNotFound'))
        } else if (response.status === 403) {
          throw new Error(t('errors.accessDenied'))
        } else if (response.status >= 500) {
          throw new Error(t('errors.serverError'))
        } else {
          throw new Error(t('errors.requestFailed', { status: response.status }))
        }
      }
      
      const rawData = await response.json()
      const data = sanitizeApiData(rawData)
      
      if (!data) {
        throw new Error(t('errors.invalidDataReceived'))
      }
      
      // Update state with validated data
      setAnalyticsData(data)
      setMetrics(data.metrics || [])
      setWeeklyData(data.weeklyActivity || [])
      setMonthlyEarnings(data.monthlyEarnings || [])
      setStudentProgress(data.studentProgress || [])
      setTimeDistribution(data.timeDistribution || [])
      setSubjectPerformance(data.subjectPerformance || [])
      setError(null)
      setRetryCount(0)
      
    } catch (err) {
      // Don't update state if request was aborted
      if (signal.aborted) return
      
      const errorMessage = err instanceof Error ? err.message : t('errors.fetchFailedFallback')
      console.error('Analytics fetch error:', err)
      
      // Retry logic with exponential backoff
      if (retryCount < maxRetries && !isRetry) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          fetchAnalytics(true)
        }, retryDelay * Math.pow(2, retryCount))
        return
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [tutorId, selectedPeriod, retryCount, t])

  useEffect(() => {
    setIsHydrated(true)
    fetchAnalytics()
  }, [tutorId, selectedPeriod, fetchAnalytics])
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

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

  // Memoized calculations with NaN protection
  const chartData = useMemo(() => {
    const validWeeklyData = weeklyData.filter(d => 
      isValidNumber(d.sessions) && 
      isValidNumber(d.hours) && 
      isValidNumber(d.earnings)
    )
    
    if (validWeeklyData.length === 0) {
      return { maxSessions: 1, maxHours: 1, maxEarnings: 1 }
    }
    
    const sessions = validWeeklyData.map(d => d.sessions)
    const hours = validWeeklyData.map(d => d.hours)
    const earnings = validWeeklyData.map(d => d.earnings)
    
    return {
      maxSessions: Math.max(...sessions, 1),
      maxHours: Math.max(...hours, 1),
      maxEarnings: Math.max(...earnings, 1)
    }
  }, [weeklyData])
  
  // Safe currency formatter with error handling
  const formatCurrency = useCallback((amount: any): string => {
    if (!isValidNumber(amount)) return '$0'
    
    try {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.max(0, amount))
    } catch (error) {
      console.warn('Currency formatting error:', error)
      return `$${Math.round(Math.max(0, amount))}`
    }
  }, [])
  
  // Safe percentage calculator
  const calculatePercentage = useCallback((value: number, max: number): number => {
    if (!isValidNumber(value) || !isValidNumber(max) || max === 0) return 0
    return Math.min(100, Math.max(0, (value / max) * 100))
  }, [])

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

  // Error state with retry option
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('errors.loadFailedTitle')}</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {retryCount < maxRetries && (
            <button
              onClick={() => fetchAnalytics()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              disabled={loading}
            >
              {loading ? t('actions.retrying') : t('actions.tryAgain')}
            </button>
          )}
          {retryCount >= maxRetries && (
            <div className="text-sm text-gray-500">
              {t('errors.contactSupport')}
            </div>
          )}
        </div>
      </div>
    )
  }

  // No data state
  if (!analyticsData || (metrics.length === 0 && weeklyData.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('empty.title')}</h3>
          <p className="text-gray-600 mb-4">
            {t('empty.message')}
          </p>
          <button
            onClick={() => fetchAnalytics()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            {t('empty.refreshData')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{t('dashboardTitle')}</h3>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">{t('period.last7Days')}</option>
            <option value="30d">{t('period.last30Days')}</option>
            <option value="90d">{t('period.last3Months')}</option>
            <option value="365d">{t('period.lastYear')}</option>
          </select>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-8">
          {[
            { id: 'overview', label: t('tabs.overview'), icon: '📊' },
            { id: 'students', label: t('tabs.students'), icon: '👥' },
            { id: 'subjects', label: t('tabs.subjects'), icon: '📚' },
            { id: 'schedule', label: t('tabs.schedule'), icon: '⏰' }
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
              {metrics.map((metric) => (
                <div key={metric.label} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
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
              <h4 className="text-lg font-medium text-gray-900 mb-4">{t('weeklyActivity.title')}</h4>
              <div className="grid grid-cols-7 gap-2">
                {weeklyData.map((day) => (
                  <div key={day.day} className="text-center">
                    <div className="text-sm font-medium text-gray-600 mb-2">{day.day}</div>
                    
                    {/* Sessions Bar */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">{t('weeklyActivity.sessions')}</div>
                      <div className="h-20 bg-gray-100 rounded relative">
                        <div 
                          className="absolute bottom-0 w-full bg-blue-500 rounded"
                          style={{ height: `${calculatePercentage(day.sessions, chartData.maxSessions)}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                          {isValidNumber(day.sessions) ? day.sessions : 0}
                        </div>
                      </div>
                    </div>

                    {/* Hours Bar */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">{t('weeklyActivity.hours')}</div>
                      <div className="h-16 bg-gray-100 rounded relative">
                        <div 
                          className="absolute bottom-0 w-full bg-green-500 rounded"
                          style={{ height: `${calculatePercentage(day.hours, chartData.maxHours)}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                          {isValidNumber(day.hours) ? day.hours.toFixed(1) : '0.0'}
                        </div>
                      </div>
                    </div>

                    {/* Earnings Bar */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{t('weeklyActivity.earnings')}</div>
                      <div className="h-16 bg-gray-100 rounded relative">
                        <div 
                          className="absolute bottom-0 w-full bg-purple-500 rounded"
                          style={{ height: `${calculatePercentage(day.earnings, chartData.maxEarnings)}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                          {formatCurrency(day.earnings)}
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
                <h4 className="text-lg font-medium text-gray-900 mb-4">{t('monthlyEarnings.title')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {monthlyEarnings.map((month) => (
                    <div key={month.month} className="p-4 border border-gray-200 rounded-lg text-center">
                      <div className="text-sm font-medium text-gray-600 mb-2">{month.month}</div>
                      <div className="text-xl font-bold text-green-600 mb-1">
                        {formatCurrency(month.earnings)}
                      </div>
                      <div className="text-xs text-gray-500">{t('monthlyEarnings.hoursSessions', { hours: month.hours, sessions: month.sessions })}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900">{t('studentProgressOverview.title')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentProgress.map((student) => (
                <div key={student.studentName + student.subject} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-900">{student.studentName}</div>
                      <div className="text-sm text-gray-600">{student.subject}</div>
                    </div>
                    <div className={`flex items-center space-x-1 ${getProgressTrendColor(student.progressTrend)}`}>
                      <span>{getProgressTrendIcon(student.progressTrend)}</span>
                      <span className="text-sm font-medium">{t(`studentProgressOverview.trend.${student.progressTrend}`)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('studentProgressOverview.totalHours')}:</span>
                      <span className="font-medium">{student.totalHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('studentProgressOverview.recentSessions')}:</span>
                      <span className="font-medium">{student.recentSessions}</span>
                    </div>
                    {student.averageRating && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('studentProgressOverview.avgRating')}:</span>
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
            <h4 className="text-lg font-medium text-gray-900">{t('subjectPerformance.title')}</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('subjectPerformance.table.subject')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('subjectPerformance.table.students')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('subjectPerformance.table.sessions')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('subjectPerformance.table.totalHours')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('subjectPerformance.table.avgSession')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('subjectPerformance.table.earnings')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subjectPerformance.map((subject) => (
                    <tr key={subject.subject} className="hover:bg-gray-50">
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
            <h4 className="text-lg font-medium text-gray-900">{t('scheduleAnalysis.title')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Distribution */}
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-4">{t('scheduleAnalysis.activeTimeSlots')}</h5>
                <div className="space-y-3">
                  {timeDistribution.map((slot) => (
                    <div key={slot.timeSlot} className="flex items-center space-x-3">
                      <div className="w-20 text-sm font-medium text-gray-700">{slot.timeSlot}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${slot.percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-gray-600">{slot.sessions}</div>
                      <div className="w-12 text-xs text-gray-500">{t('scheduleAnalysis.percentage', { percentage: slot.percentage })}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule Insights */}
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-4">{t('scheduleAnalysis.insightsTitle')}</h5>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">{t('scheduleAnalysis.peakHours')}</div>
                    <div className="text-sm text-blue-700">
                      {timeDistribution.length > 0 && isValidString(timeDistribution[0]?.timeSlot) 
                        ? t('scheduleAnalysis.peakHoursMessage', { time: timeDistribution[0].timeSlot })
                        : t('scheduleAnalysis.noTimeData')
                      }
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm font-medium text-green-900">{t('scheduleAnalysis.availabilityOptimization')}</div>
                    <div className="text-sm text-green-700">
                      {t('scheduleAnalysis.optimizationMessage')}
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-yellow-900">{t('scheduleAnalysis.workLifeBalance')}</div>
                    <div className="text-sm text-yellow-700">
                      {(() => {
                        const totalHours = weeklyData
                          .filter(day => isValidNumber(day.hours))
                          .reduce((sum, day) => sum + day.hours, 0)
                        return t('scheduleAnalysis.hoursThisWeek', { hours: totalHours.toFixed(1) })
                      })()}
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

// Wrap with ErrorBoundary for additional safety
function TutorAnalyticsWithErrorBoundary(props: TutorAnalyticsProps) {
  return (
    <ErrorBoundary>
      <TutorAnalytics {...props} />
    </ErrorBoundary>
  )
}

export default TutorAnalyticsWithErrorBoundary