'use client'

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { DashboardSkeleton, AppointmentSkeleton, AvailabilitySkeleton, NotesSkeleton } from '../../../components/ui/LoadingSkeletons'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import ErrorBoundary from '../../../components/ErrorBoundary'
import { WidgetError, SectionError } from '../../../components/ui/ErrorFallbacks'
import { NotificationBell } from '../../../components/NotificationBell'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import { Clock, CreditCard } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

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
const BrowseTutors = lazy(() => import('../../../components/student/BrowseTutors'))
const ProfileManager = lazy(() => import('../../../components/dashboard/ProfileManager'))

function StudentDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations('StudentDashboard')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'assignments' | 'billing' | 'notifications' | 'settings'>('dashboard')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const initialTutorId = searchParams.get('tutorId')
  const initialSubject = searchParams.get('subject')

  // Effect to handle initial tab from URL or query params
  useEffect(() => {
    if (initialTutorId) {
      setActiveTab('sessions')
    }
  }, [initialTutorId])

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
    { id: 'dashboard', name: t('tabs.dashboard'), icon: '🏠' },
    { id: 'sessions', name: t('tabs.sessions'), icon: '📅' },
    { id: 'assignments', name: t('tabs.assignments'), icon: '📝' },
    { id: 'billing', name: t('tabs.billing'), icon: '💳' },
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
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t('title')}</h1>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">{t('subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <ThemeToggle />
              </div>
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
        {activeTab === 'dashboard' && (
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
            </div>

            {/* Two Column Layout: Calendar + Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Calendar View */}
              <div>
                <ErrorBoundary fallback={<SectionError title="Calendar Error" message="Unable to load the calendar view." />}>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <CalendarView />
                  </Suspense>
                </ErrorBoundary>
              </div>

              {/* Progress Charts */}
              <div>
                <ErrorBoundary fallback={<SectionError title="Progress Error" message="Could not load progress data." />}>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <StudentProgress studentId={user?.id || ''} />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-lg shadow p-6 border border-border transition-colors duration-300 mb-8">
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
                  onClick={() => setActiveTab('sessions')}
                  className="w-full p-3 text-left border border-border rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📅</span>
                    <div>
                      <p className="font-medium text-foreground">{t('quickActions.sessions')}</p>
                      <p className="text-sm text-muted-foreground">{t('quickActions.sessionsDesc')}</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('billing')}
                  className="w-full p-3 text-left border border-border rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💳</span>
                    <div>
                      <p className="font-medium text-foreground">{t('quickActions.billing')}</p>
                      <p className="text-sm text-muted-foreground">{t('quickActions.billingDesc')}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Browse Tutors Section */}
            <div className="mb-8">
              <ErrorBoundary fallback={<SectionError title="Browse Error" message="Could not load tutors." />}>
                <Suspense fallback={<DashboardSkeleton />}>
                  <BrowseTutors />
                </Suspense>
              </ErrorBoundary>
            </div>

            {/* Appointment List - Full width */}
            <ErrorBoundary fallback={<SectionError title="Appointments Error" message="Could not load your appointments." />}>
              <AppointmentList refreshTrigger={refreshTrigger} />
            </ErrorBoundary>
          </div>
        )}

        {/* Sessions Tab - Merged: Manage + Appointments */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Booking Form */}
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Book New Session</h3>
              <ErrorBoundary fallback={<WidgetError title="Booking Error" message="Appointment form unavailable." />}>
                <Suspense fallback={<AvailabilitySkeleton />}>
                  <EnhancedAppointmentForm
                    initialDate={selectedDate}
                    initialTutorId={initialTutorId}
                    initialSubject={initialSubject}
                    onAppointmentCreated={handleAppointmentCreated}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>

            {/* Appointment Manager */}
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

        {/* Billing Tab - Merged: Hours + Payments */}
        {activeTab === 'billing' && (
          <div>
            <Tabs defaultValue="hours" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="hours">
                  <Clock className="mr-2 h-4 w-4" />
                  Lecture Hours
                </TabsTrigger>
                <TabsTrigger value="payments">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hours" className="mt-6">
                <ErrorBoundary fallback={<SectionError title="Hours Error" message="Could not load lecture hours." />}>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <LectureHoursTracker userRole="student" userId={user?.id || ''} />
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                <ErrorBoundary fallback={<SectionError title="Payments Error" message="Could not load payment history." />}>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <PaymentManager userRole="student" userId={user?.id || ''} />
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeTab === 'notifications' && (
          <ErrorBoundary fallback={<SectionError title="Notifications Error" message="Could not load notifications." />}>
            <Suspense fallback={<DashboardSkeleton />}>
              <NotificationManager
                userId={user?.id || ''}
                userRole="student"
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <ErrorBoundary fallback={<SectionError title="Settings Error" message="Could not load settings." />}>
              <Suspense fallback={<AvailabilitySkeleton />}>
                <ProfileManager />
              </Suspense>
            </ErrorBoundary>
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
