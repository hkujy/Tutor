'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import CalendarView from '../../components/calendar/CalendarView'
import EnhancedAppointmentForm from '../../components/calendar/EnhancedAppointmentForm'
import AppointmentList from '../../components/calendar/AppointmentList'
import AppointmentManager from '../../components/calendar/AppointmentManager'
import StudentProgress from '../../components/dashboard/StudentProgress'
import AssignmentManager from '../../components/dashboard/AssignmentManager'

function StudentDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'assignments' | 'progress'>('overview')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Handle authentication
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (user && user.role !== 'STUDENT' && user.role !== 'ADMIN') {
      router.push('/tutor') // Redirect non-students to tutor page
    }
  }, [user, isLoading, router])

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

  const stats = [
    { label: 'Total Sessions', value: '18', icon: '📚', color: 'bg-blue-500' },
    { label: 'This Month', value: '6', icon: '📅', color: 'bg-green-500' },
    { label: 'Completed', value: '12', icon: '✅', color: 'bg-purple-500' },
    { label: 'Average Rating', value: '4.9', icon: '⭐', color: 'bg-yellow-500' }
  ]

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '🏠' },
    { id: 'manage', name: 'Manage', icon: '⚙️' },
    { id: 'assignments', name: 'Assignments', icon: '📝' },
    { id: 'progress', name: 'Progress', icon: '📊' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="mt-1 text-gray-600">Book sessions, track progress, and manage your learning journey</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar View - Takes up 2 columns on large screens */}
              <div className="lg:col-span-2">
                <CalendarView />
              </div>

              {/* Sidebar with Form */}
              <div className="space-y-6">
                <EnhancedAppointmentForm 
                  initialDate={selectedDate}
                  onAppointmentCreated={handleAppointmentCreated}
                />
                
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
            <AppointmentManager userRole="student" userId={user?.id || ''} />
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <AssignmentManager userRole="student" userId={user?.id || ''} />
          </div>
        )}

        {activeTab === 'progress' && (
          <div>
            <StudentProgress studentId={user?.id || ''} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentPage() {
  return <StudentDashboard />
}