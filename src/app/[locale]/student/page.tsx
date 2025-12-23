'use client'

import React, { useState, useEffect, Suspense, lazy } from 'react'
import Image from 'next/image'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { DashboardSkeleton, AppointmentSkeleton, AvailabilitySkeleton, NotesSkeleton } from '../../../components/ui/LoadingSkeletons'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import ErrorBoundary from '../../../components/ErrorBoundary'
import { WidgetError, SectionError } from '../../../components/ui/ErrorFallbacks'

// Lazy load heavy components to reduce initial bundle size
const CalendarView = lazy(() => import('../../../components/calendar/CalendarView'))
const EnhancedAppointmentForm = lazy(() => import('../../../components/calendar/EnhancedAppointmentForm'))
const AppointmentList = lazy(() => import('../../../components/calendar/AppointmentList'))
const AppointmentManager = lazy(() => import('../../../components/calendar/AppointmentManager'))
const StudentProgress = lazy(() => import('../../../components/dashboard/StudentProgress'))
const AssignmentManager = lazy(() => import('../../../components/dashboard/AssignmentManager'))
const LectureHoursTracker = lazy(() => import('../../../components/lecture-hours/LectureHoursTracker'))
const PaymentManager = lazy(() => import('../../../components/lecture-hours/PaymentManager'))
const NotificationManager = lazy(() => import('../../../components/notifications/NotificationManager'))
const NotificationPreferencesManager = lazy(() => import('../../../components/notifications/NotificationPreferencesManager'))

function StudentDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations('StudentDashboard')
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'assignments' | 'progress' | 'hours' | 'payments' | 'notifications' | 'settings'>('overview')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Handle authentication
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (user && user.role !== 'STUDENT' && user.role !== 'ADMIN') {
      router.push('/tutor') // Redirect non-students to tutor page
    }
  }, [user, isLoading, router])

  const fetchDashboardStats = async (userId: string) => {
    try {
      const res = await fetch(`/api/dashboard?tutorId=${userId}&role=student`)
      const data = await res.json()
      setDashboardStats(data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchDashboardStats(user.id)
    }
  }, [user])

  // Show loading while checking authentication
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  // Don't render if not authenticated or not a student
  if (!user || (user.role !== 'STUDENT' && user.role !== 'ADMIN')) {
    return null
  }

  const handleAppointmentCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const stats = dashboardStats?.stats ? [
    { label: t('stats.totalSessions'), value: dashboardStats.stats.totalAppointments.toString(), icon: '📚', color: 'bg-blue-500' },
    { label: t('stats.thisMonth'), value: dashboardStats.stats.upcomingAppointments.toString(), icon: '📅', color: 'bg-green-500' },
    { label: t('stats.completed'), value: dashboardStats.stats.completedAppointments.toString(), icon: '✅', color: 'bg-purple-500' },
    { label: t('stats.averageRating'), value: dashboardStats.stats.avgRating.toString(), icon: '⭐', color: 'bg-yellow-500' }
  ] : [
    { label: t('stats.totalSessions'), value: '0', icon: '📚', color: 'bg-blue-500' },
    { label: t('stats.thisMonth'), value: '0', icon: '📅', color: 'bg-green-500' },
    { label: t('stats.completed'), value: '0', icon: '✅', color: 'bg-purple-500' },
    { label: t('stats.averageRating'), value: '0', icon: '⭐', color: 'bg-yellow-500' }
  ]

  const tabs = [
    { id: 'overview', name: t('tabs.overview'), icon: '🏠' },
    { id: 'manage', name: t('tabs.manage'), icon: '⚙️' },
    { id: 'assignments', name: t('tabs.assignments'), icon: '📝' },
    { id: 'progress', name: t('tabs.progress'), icon: '📊' },
    { id: 'hours', name: t('tabs.hours'), icon: '⏰' },
    { id: 'payments', name: t('tabs.payments'), icon: '💳' },
    { id: 'notifications', name: t('tabs.notifications'), icon: '🔔' },
    { id: 'settings', name: t('tabs.settings'), icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header - Mobile Optimized */}
      <div className="bg-card shadow-sm border-b border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Image
                  src="/logo.png"
                  alt="Tutoring Calendar Logo"
                  width={40}
                  height={40}
                  className="rounded-lg shadow-sm hidden xs:block sm:w-12 sm:h-12"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t('title')}</h1>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">{t('subtitle')}</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg shadow p-6 animate-pulse border border-border">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-muted rounded-lg mr-4"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                        <div className="h-6 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                stats.map((stat, index) => (
                  <div key={index} className="bg-card rounded-lg shadow p-6 border border-border transition-all duration-200 hover:shadow-lg">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar View - Takes up 2 columns on large screens */}
              <div className="lg:col-span-2">
                <ErrorBoundary fallback={<SectionError title="Calendar Error" message="Unable to load the calendar view." />}>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <CalendarView />
                  </Suspense>
                </ErrorBoundary>
              </div>

              {/* Sidebar with Form */}
              <div className="space-y-6">
                <ErrorBoundary fallback={<WidgetError title="Booking Error" message="Appointment form unavailable." />}>
                  <Suspense fallback={<AvailabilitySkeleton />}>
                    <EnhancedAppointmentForm
                      initialDate={selectedDate}
                      onAppointmentCreated={handleAppointmentCreated}
                    />
                  </Suspense>
                </ErrorBoundary>

                {/* Quick Actions */}
                <div className="bg-card rounded-lg shadow p-6 border border-border transition-colors duration-300">
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('quickActions.title')}</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('assignments')}
                      className="w-full p-3 text-left border border-border rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📋</span>
                        <div>
                          <p className="font-medium text-foreground">{t('quickActions.assignments')}</p>
                          <p className="text-sm text-muted-foreground">{t('quickActions.assignmentsDesc')}</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('progress')}
                      className="w-full p-3 text-left border border-border rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📊</span>
                        <div>
                          <p className="font-medium text-foreground">{t('quickActions.progress')}</p>
                          <p className="text-sm text-muted-foreground">{t('quickActions.progressDesc')}</p>
                        </div>
                      </div>
                    </button>
                    <button className="w-full p-3 text-left border border-border rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">💬</span>
                        <div>
                          <p className="font-medium text-foreground">{t('quickActions.messages')}</p>
                          <p className="text-sm text-muted-foreground">{t('quickActions.messagesDesc')}</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment List - Full width below calendar */}
            <div className="mt-8">
              <ErrorBoundary fallback={<SectionError title="Appointments Error" message="Could not load your appointments." />}>
                <AppointmentList refreshTrigger={refreshTrigger} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Other components... */}
        {activeTab === 'manage' && (
          <div>
            <ErrorBoundary fallback={<SectionError title="Management Error" message="Appointment manager unavailable." />}>
              <Suspense fallback={<AppointmentSkeleton />}>
                <AppointmentManager userRole="student" userId={user?.id || ''} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <ErrorBoundary fallback={<SectionError title="Assignments Error" message="Could not load assignments." />}>
              <Suspense fallback={<DashboardSkeleton />}>
                <AssignmentManager userRole="student" userId={user?.id || ''} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'progress' && (
          <div>
            <ErrorBoundary fallback={<SectionError title="Progress Error" message="Could not load progress data." />}>
              <Suspense fallback={<DashboardSkeleton />}>
                <StudentProgress studentId={user?.id || ''} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'hours' && (
          <div>
            <ErrorBoundary fallback={<SectionError title="Hours Error" message="Could not load lecture hours." />}>
              <Suspense fallback={<DashboardSkeleton />}>
                <LectureHoursTracker userRole="student" userId={user?.id || ''} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <ErrorBoundary fallback={<SectionError title="Payments Error" message="Could not load payment history." />}>
              <Suspense fallback={<DashboardSkeleton />}>
                <PaymentManager userRole="student" userId={user?.id || ''} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <ErrorBoundary fallback={<SectionError title="Notifications Error" message="Could not load notifications." />}>
              <Suspense fallback={<NotesSkeleton />}>
                <NotificationManager userId={user?.id || ''} userRole="student" />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <ErrorBoundary fallback={<SectionError title="Settings Error" message="Could not load settings." />}>
              <Suspense fallback={<AvailabilitySkeleton />}>
                <NotificationPreferencesManager userId={user?.id || ''} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentPage() {
  return <StudentDashboard />
}
