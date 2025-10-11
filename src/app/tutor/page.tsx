'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import TutorAvailability from '../../components/availability/TutorAvailability'
import AppointmentManagement from '../../components/calendar/AppointmentManagement'
import TutorAppointmentForm from '../../components/calendar/TutorAppointmentForm'
import TutorAnalytics from '../../components/dashboard/TutorAnalytics'
import AssignmentManager from '../../components/dashboard/AssignmentManager'
import LectureHoursTracker from '../../components/lecture-hours/LectureHoursTracker'
import PaymentManager from '../../components/lecture-hours/PaymentManager'
import StudentSummaryList from '../../components/dashboard/StudentSummaryList'
import NotificationManager from '../../components/notifications/NotificationManager'
import NotificationPreferencesManager from '../../components/notifications/NotificationPreferencesManager'

function TutorDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'availability' | 'appointments' | 'create' | 'analytics' | 'assignments' | 'hours' | 'payments' | 'notifications' | 'settings'>('overview')
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'students', name: 'Students', icon: '👥' },
    { id: 'availability', name: 'Availability', icon: '🗓️' },
    { id: 'appointments', name: 'Appointments', icon: '📅' },
    { id: 'create', name: 'Create Appointment', icon: '➕' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'assignments', name: 'Assignments', icon: '📝' },
    { id: 'hours', name: 'Lecture Hours', icon: '⏰' },
    { id: 'payments', name: 'Payments', icon: '💳' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ]

  const stats = dashboardStats?.stats ? [
    { label: 'Total Students', value: dashboardStats.stats.totalStudents.toString(), icon: '👥', color: 'bg-blue-500' },
    { label: 'This Week', value: dashboardStats.stats.upcomingAppointments.toString(), icon: '📚', color: 'bg-green-500' },
    { label: 'Completed', value: dashboardStats.stats.completedAppointments.toString(), icon: '✅', color: 'bg-purple-500' },
    { label: 'Rating', value: dashboardStats.stats.avgRating.toString(), icon: '⭐', color: 'bg-yellow-500' }
  ] : [
    { label: 'Total Students', value: '24', icon: '👥', color: 'bg-blue-500' },
    { label: 'This Week', value: '8', icon: '📚', color: 'bg-green-500' },
    { label: 'Next Week', value: '12', icon: '⏰', color: 'bg-yellow-500' },
    { label: 'Rating', value: '4.8', icon: '⭐', color: 'bg-purple-500' }
  ]

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Tutor Dashboard</h1>
            <p className="mt-1 text-gray-600">Manage your availability, appointments, and student progress</p>
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                      <span className="text-white text-2xl">{stat.icon}</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('availability')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🗓️</span>
                    <p className="font-medium text-gray-900">Set Availability</p>
                    <p className="text-sm text-gray-600">Manage your weekly schedule</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📅</span>
                    <p className="font-medium text-gray-900">View Appointments</p>
                    <p className="text-sm text-gray-600">Check your upcoming sessions</p>
                  </div>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📊</span>
                    <p className="font-medium text-gray-900">View Analytics</p>
                    <p className="text-sm text-gray-600">Track your performance</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                  {dashboardStats.recentAppointments.slice(0, 5).map((appointment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">✓</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            Session with {appointment.student?.user?.firstName} {appointment.student?.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{appointment.subject} - {new Date(appointment.startTime).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">{appointment.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">✓</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Session completed with John Doe</p>
                        <p className="text-sm text-gray-500">Mathematics - 2 hours ago</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">Today</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">📚</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">New student registered</p>
                        <p className="text-sm text-gray-500">Jane Smith - Physics</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">Yesterday</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <StudentSummaryList tutorId={user?.id || ''} />
          </div>
        )}

        {activeTab === 'availability' && (
          <div>
            <TutorAvailability tutorId={user?.id || ''} />
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            <AppointmentManagement userRole="tutor" userId={user?.id || ''} />
          </div>
        )}

        {activeTab === 'create' && (
          <div>
            <TutorAppointmentForm onAppointmentCreated={() => {
              // Optionally refresh appointments or show success message
              console.log('Appointment created successfully!')
            }} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <TutorAnalytics tutorId={user?.id || ''} />
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <AssignmentManager userRole="tutor" userId={user?.id || ''} />
          </div>
        )}

        {activeTab === 'hours' && (
          <div>
            <LectureHoursTracker userRole="tutor" userId={user?.id || ''} />
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <PaymentManager userRole="tutor" userId={user?.id || ''} />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <NotificationManager userId={user?.id || ''} userRole="tutor" />
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <NotificationPreferencesManager userId={user?.id || ''} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function TutorPage() {
  return <TutorDashboard />
}