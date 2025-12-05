'use client'

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { DashboardSkeleton, AppointmentSkeleton, AvailabilitySkeleton, NotesSkeleton } from '../../components/ui/LoadingSkeletons'

// Lazy load heavy components to reduce initial bundle size
const CalendarView = lazy(() => import('../../components/calendar/CalendarView'))
const EnhancedAppointmentForm = lazy(() => import('../../components/calendar/EnhancedAppointmentForm'))
const AppointmentList = lazy(() => import('../../components/calendar/AppointmentList'))
const AppointmentManager = lazy(() => import('../../components/calendar/AppointmentManager'))
const StudentProgress = lazy(() => import('../../components/dashboard/StudentProgress'))
const AssignmentManager = lazy(() => import('../../components/dashboard/AssignmentManager'))
const LectureHoursTracker = lazy(() => import('../../components/lecture-hours/LectureHoursTracker'))
const PaymentManager = lazy(() => import('../../components/lecture-hours/PaymentManager'))
const NotificationManager = lazy(() => import('../../components/notifications/NotificationManager'))
const NotificationPreferencesManager = lazy(() => import('../../components/notifications/NotificationPreferencesManager'))

function StudentDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
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
    { label: 'Total Sessions', value: dashboardStats.stats.totalAppointments.toString(), icon: '📚', color: 'bg-blue-500' },
    { label: 'This Month', value: dashboardStats.stats.upcomingAppointments.toString(), icon: '📅', color: 'bg-green-500' },
    { label: 'Completed', value: dashboardStats.stats.completedAppointments.toString(), icon: '✅', color: 'bg-purple-500' },
    { label: 'Average Rating', value: dashboardStats.stats.avgRating.toString(), icon: '⭐', color: 'bg-yellow-500' }
  ] : [
    { label: 'Total Sessions', value: '0', icon: '📚', color: 'bg-blue-500' },
    { label: 'This Month', value: '0', icon: '📅', color: 'bg-green-500' },
    { label: 'Completed', value: '0', icon: '✅', color: 'bg-purple-500' },
    { label: 'Average Rating', value: '0', icon: '⭐', color: 'bg-yellow-500' }
  ]

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '🏠' },
    { id: 'manage', name: 'Manage', icon: '⚙️' },
    { id: 'assignments', name: 'Assignments', icon: '📝' },
    { id: 'progress', name: 'Progress', icon: '📊' },
    { id: 'hours', name: 'Lecture Hours', icon: '⏰' },
    { id: 'payments', name: 'Payments', icon: '💳' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo.svg" 
                alt="Tutoring Calendar Logo" 
                width={48} 
                height={48}
                className="rounded-lg shadow-sm"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="mt-1 text-gray-600">Book sessions, track progress, and manage your learning journey</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
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
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar View - Takes up 2 columns on large screens */}
              <div className="lg:col-span-2">
                <Suspense fallback={<DashboardSkeleton />}>
                  <CalendarView />
                </Suspense>
              </div>

              {/* Sidebar with Form */}
              <div className="space-y-6">
                <Suspense fallback={<AvailabilitySkeleton />}>
                  <EnhancedAppointmentForm 
                    initialDate={selectedDate}
                    onAppointmentCreated={handleAppointmentCreated}
                  />
                </Suspense>
                
                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setActiveTab('assignments')}
                      className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📋</span>
                        <div>
                          <p className="font-medium text-gray-900">View Assignments</p>
                          <p className="text-sm text-gray-600">Check your homework and tasks</p>
                        </div>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('progress')}
                      className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📊</span>
                        <div>
                          <p className="font-medium text-gray-900">Progress Report</p>
                          <p className="text-sm text-gray-600">See your learning progress</p>
                        </div>
                      </div>
                    </button>
                    <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">💬</span>
                        <div>
                          <p className="font-medium text-gray-900">Messages</p>
                          <p className="text-sm text-gray-600">Chat with your tutors</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment List - Full width below calendar */}
            <div className="mt-8">
              <AppointmentList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div>
            <Suspense fallback={<AppointmentSkeleton />}>
              <AppointmentManager userRole="student" userId={user?.id || ''} />
            </Suspense>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <Suspense fallback={<DashboardSkeleton />}>
              <AssignmentManager userRole="student" userId={user?.id || ''} />
            </Suspense>
          </div>
        )}

        {activeTab === 'progress' && (
          <div>
            <Suspense fallback={<DashboardSkeleton />}>
              <StudentProgress studentId={user?.id || ''} />
            </Suspense>
          </div>
        )}

        {activeTab === 'hours' && (
          <div>
            <Suspense fallback={<DashboardSkeleton />}>
              <LectureHoursTracker userRole="student" userId={user?.id || ''} />
            </Suspense>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <Suspense fallback={<DashboardSkeleton />}>
              <PaymentManager userRole="student" userId={user?.id || ''} />
            </Suspense>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <Suspense fallback={<NotesSkeleton />}>
              <NotificationManager userId={user?.id || ''} userRole="student" />
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

export default function StudentPage() {
  return <StudentDashboard />
}