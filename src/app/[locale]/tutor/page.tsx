'use client'

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { DashboardSkeleton, AppointmentSkeleton, AvailabilitySkeleton, NotesSkeleton } from '../../../components/ui/LoadingSkeletons'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import { NotificationBell } from '../../../components/NotificationBell'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import { Button } from '../../../components/ui/button'
import { Plus, Clock, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

// Lazy load heavy components to reduce initial bundle size
const TutorAvailability = lazy(() => import('../../../components/availability/TutorAvailability'))
const AppointmentManagement = lazy(() => import('../../../components/calendar/AppointmentManagement'))
const TutorAppointmentForm = lazy(() => import('../../../components/calendar/TutorAppointmentForm'))
const TutorAnalytics = lazy(() => import('../../../components/dashboard/TutorAnalytics'))
const AssignmentManager = lazy(() => import('../../../components/dashboard/AssignmentManager'))
const LectureHoursTracker = lazy(() => import('../../../components/lecture-hours/LectureHoursTracker'))
const PaymentManager = lazy(() => import('../../../components/lecture-hours/PaymentManager'))
const StudentSummaryList = lazy(() => import('../../../components/dashboard/StudentSummaryList'))
const NotificationManager = lazy(() => import('../../../components/notifications/NotificationManager'))
const NotificationPreferencesManager = lazy(() => import('../../../components/notifications/NotificationPreferencesManager'))

function TutorDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations('TutorDashboard')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'availability' | 'appointments' | 'assignments' | 'billing' | 'settings'>('dashboard')
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Handle authentication
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (user && user.role !== 'TUTOR' && user.role !== 'ADMIN') {
      router.push('/student') // Redirect non-tutors to student page
    }
  }, [user, isLoading, router])

  const fetchDashboardStats = async (tutorId: string) => {
    try {
      const res = await fetch(`/api/dashboard?tutorId=${tutorId}&role=tutor`)
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

  // Don't render if not authenticated or not a tutor
  if (!user || (user.role !== 'TUTOR' && user.role !== 'ADMIN')) {
    return null
  }

  const tabs = [
    { id: 'dashboard', name: t('tabs.dashboard'), icon: '📊' },
    { id: 'students', name: t('tabs.students'), icon: '👥' },
    { id: 'availability', name: t('tabs.availability'), icon: '🗓️' },
    { id: 'appointments', name: t('tabs.appointments'), icon: '📅' },
    { id: 'assignments', name: t('tabs.assignments'), icon: '📝' },
    { id: 'billing', name: t('tabs.billing'), icon: '💳' },
    { id: 'settings', name: t('tabs.settings'), icon: '⚙️' }
  ]

  const stats = dashboardStats?.stats ? [
    { label: t('stats.totalStudents'), value: dashboardStats.stats.totalStudents.toString(), icon: '👥', color: 'bg-blue-500' },
    { label: t('stats.thisWeek'), value: dashboardStats.stats.upcomingAppointments.toString(), icon: '📚', color: 'bg-green-500' },
    { label: t('stats.completed'), value: dashboardStats.stats.completedAppointments.toString(), icon: '✅', color: 'bg-purple-500' },
    { label: t('stats.rating'), value: dashboardStats.stats.avgRating.toString(), icon: '⭐', color: 'bg-yellow-500' }
  ] : [
    { label: t('stats.totalStudents'), value: '24', icon: '👥', color: 'bg-blue-500' },
    { label: t('stats.thisWeek'), value: '8', icon: '📚', color: 'bg-green-500' },
    { label: t('stats.thisWeek'), value: '12', icon: '⏰', color: 'bg-yellow-500' }, // Reusing thisWeek key or create nextWeek if needed, leaving as placeholder
    { label: t('stats.rating'), value: '0.0', icon: '⭐', color: 'bg-purple-500' }
  ]

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                  <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
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

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-card rounded-lg shadow p-6 border border-border">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                      <span className="text-white text-2xl">{stat.icon}</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Analytics Section */}
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics.title')}</h3>
              <Suspense fallback={<DashboardSkeleton />}>
                <TutorAnalytics tutorId={user?.id || ''} />
              </Suspense>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('quickActions.title')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('availability')}
                  className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/10 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🗓️</span>
                    <p className="font-medium text-foreground">{t('quickActions.availability')}</p>
                    <p className="text-sm text-muted-foreground">{t('quickActions.availabilityDesc')}</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📅</span>
                    <p className="font-medium text-foreground">{t('quickActions.appointments')}</p>
                    <p className="text-sm text-muted-foreground">{t('quickActions.appointmentsDesc')}</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">👥</span>
                    <p className="font-medium text-foreground">{t('quickActions.students')}</p>
                    <p className="text-sm text-muted-foreground">{t('quickActions.studentsDesc')}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('recentActivity.title')}</h3>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="ml-3">
                          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : dashboardStats?.recentAppointments?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardStats.recentAppointments.slice(0, 5).map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">✓</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-foreground">
                            {t('recentActivity.sessionCompleted', { name: `${appointment.student?.user?.firstName} ${appointment.student?.user?.lastName}` })}
                          </p>
                          <p className="text-sm text-muted-foreground">{appointment.subject} - {new Date(appointment.startTime).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{appointment.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">✓</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-foreground">{t('recentActivity.sessionCompleted', { name: 'John Doe' })}</p>
                        <p className="text-sm text-muted-foreground">Mathematics - 2 hours ago</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{t('recentActivity.today')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other tabs components are internal and complex, ideally should be translated too, but starting with Overview */}
        {activeTab === 'students' && (
          <div>
            <Suspense fallback={<DashboardSkeleton />}>
              <StudentSummaryList tutorId={user?.id || ''} />
            </Suspense>
          </div>
        )}

        {activeTab === 'availability' && (
          <div>
            <Suspense fallback={<AvailabilitySkeleton />}>
              <TutorAvailability tutorId={user?.id || ''} />
            </Suspense>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            {/* Header with Create Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Appointments</h2>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="mr-2 h-4 w-4" />
                {showCreateForm ? 'Cancel' : 'Create Appointment'}
              </Button>
            </div>

            {/* Create Form (conditional) */}
            {showCreateForm && (
              <div className="mb-6 bg-card rounded-lg shadow p-6 border border-border">
                <Suspense fallback={<AvailabilitySkeleton />}>
                  <TutorAppointmentForm
                    onAppointmentCreated={() => {
                      setShowCreateForm(false);
                      toast.success('Appointment created successfully!');
                    }}
                  />
                </Suspense>
              </div>
            )}

            {/* Appointment List */}
            <Suspense fallback={<AppointmentSkeleton />}>
              <AppointmentManagement userRole="tutor" userId={user?.id || ''} />
            </Suspense>
          </div>
        )}

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
                <Suspense fallback={<DashboardSkeleton />}>
                  <LectureHoursTracker userRole="tutor" userId={user?.id || ''} />
                </Suspense>
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                <Suspense fallback={<DashboardSkeleton />}>
                  <PaymentManager userRole="tutor" userId={user?.id || ''} />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <Suspense fallback={<DashboardSkeleton />}>
              <AssignmentManager userRole="tutor" userId={user?.id || ''} />
            </Suspense>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <Suspense fallback={<AvailabilitySkeleton />}>
              <NotificationPreferencesManager userId={user?.id || ''} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TutorPage() {
  return <TutorDashboard />
}
