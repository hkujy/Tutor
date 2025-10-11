'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { format, parseISO, addDays, isAfter, isToday, isBefore, startOfDay, endOfDay } from 'date-fns'

interface Appointment {
  id: string
  startTime: string
  endTime: string
  subject: string
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  tutor: {
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
  student: {
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

interface AppointmentManagementProps {
  userRole: 'tutor' | 'student'
  userId: string
  refreshTrigger?: number
}

export default function AppointmentManagement({ userRole, userId, refreshTrigger }: AppointmentManagementProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  
  // Filtering and sorting
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past' | 'today'>('upcoming')
  const [sortBy, setSortBy] = useState<'date' | 'subject' | 'status'>('date')
  
  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Reschedule form state
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleSubject, setRescheduleSubject] = useState('')
  const [rescheduleNotes, setRescheduleNotes] = useState('')

  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setCurrentTime(new Date())
    setIsHydrated(true)
  }, [])

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/appointments')
      const data = await res.json()
      
      // Filter appointments based on user role and ID
      const filteredAppointments = data.appointments.filter((apt: Appointment) => {
        if (userRole === 'tutor') {
          return apt.tutor && apt.tutor.user
        } else {
          return apt.student && apt.student.user
        }
      })
      
      setAppointments(filteredAppointments)
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [userRole])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments, refreshTrigger])

  const handleReschedule = async () => {
    if (!selectedAppointment) return

    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAppointment.id,
          date: rescheduleDate,
          time: rescheduleTime,
          subject: rescheduleSubject || selectedAppointment.subject,
          notes: rescheduleNotes,
          status: 'SCHEDULED'
        })
      })

      if (res.ok) {
        await fetchAppointments()
        setShowRescheduleModal(false)
        resetRescheduleForm()
      }
    } catch (error) {
      console.error('Failed to reschedule appointment:', error)
    }
  }

  const handleCancel = async () => {
    if (!selectedAppointment) return

    try {
      const res = await fetch(`/api/appointments?id=${selectedAppointment.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await fetchAppointments()
        setShowCancelModal(false)
        setSelectedAppointment(null)
      }
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
    }
  }

  const handleMarkCompleted = async (appointment: Appointment) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointment.id,
          status: 'COMPLETED'
        })
      })

      if (res.ok) {
        await fetchAppointments()
      }
    } catch (error) {
      console.error('Failed to mark appointment as completed:', error)
    }
  }

  const openRescheduleModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    const startTime = parseISO(appointment.startTime)
    setRescheduleDate(format(startTime, 'yyyy-MM-dd'))
    setRescheduleTime(format(startTime, 'HH:mm'))
    setRescheduleSubject(appointment.subject)
    setRescheduleNotes(appointment.notes || '')
    setShowRescheduleModal(true)
  }

  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowCancelModal(true)
  }

  const resetRescheduleForm = () => {
    setRescheduleDate('')
    setRescheduleTime('')
    setRescheduleSubject('')
    setRescheduleNotes('')
    setSelectedAppointment(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-purple-100 text-purple-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'NO_SHOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canReschedule = (appointment: Appointment) => {
    const appointmentTime = parseISO(appointment.startTime)
    const now = new Date()
    return isAfter(appointmentTime, addDays(now, 0)) && appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED'
  }

  const canCancel = (appointment: Appointment) => {
    return appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED'
  }

  const canMarkCompleted = (appointment: Appointment) => {
    return userRole === 'tutor' && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED'
  }

  // Filter appointments by status and time
  const filteredAppointments = appointments.filter(apt => {
    // Status filter
    if (filterStatus !== 'all' && apt.status !== filterStatus) {
      return false
    }

    // Time filter
    if (currentTime && timeFilter !== 'all') {
      const appointmentDate = parseISO(apt.startTime)
      const today = startOfDay(currentTime)
      const endOfToday = endOfDay(currentTime)

      switch (timeFilter) {
        case 'today':
          return appointmentDate >= today && appointmentDate <= endOfToday
        case 'upcoming':
          return isAfter(appointmentDate, currentTime)
        case 'past':
          return isBefore(appointmentDate, currentTime)
        default:
          return true
      }
    }

    return true
  })

  // Sort appointments
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      case 'subject':
        return a.subject.localeCompare(b.subject)
      case 'status':
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and view controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Appointment Management</h2>
          <p className="text-sm text-gray-600">
            {filteredAppointments.length} of {appointments.length} appointments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Time</option>
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="past">Past</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="date">Sort by Date</option>
            <option value="subject">Sort by Subject</option>
            <option value="status">Sort by Status</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm border-l ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Display */}
      {sortedAppointments.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterStatus !== 'all' || timeFilter !== 'all' 
              ? 'Try adjusting your filters to see more appointments.'
              : 'Get started by creating your first appointment.'
            }
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {sortedAppointments.map((appointment) => (
              <li key={appointment.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{appointment.subject}</p>
                          <p className="text-sm text-gray-500">
                            {userRole === 'tutor' 
                              ? `${appointment.student.user.firstName} ${appointment.student.user.lastName}`
                              : `${appointment.tutor.user.firstName} ${appointment.tutor.user.lastName}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          {isHydrated && format(parseISO(appointment.startTime), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isHydrated && format(parseISO(appointment.startTime), 'h:mm a')} - {isHydrated && format(parseISO(appointment.endTime), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    {appointment.notes && (
                      <p className="mt-2 text-sm text-gray-600">{appointment.notes}</p>
                    )}
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-2">
                    {canReschedule(appointment) && (
                      <button
                        onClick={() => openRescheduleModal(appointment)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Reschedule
                      </button>
                    )}
                    {canMarkCompleted(appointment) && (
                      <button
                        onClick={() => handleMarkCompleted(appointment)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Complete
                      </button>
                    )}
                    {canCancel(appointment) && (
                      <button
                        onClick={() => openCancelModal(appointment)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">{appointment.subject}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>
                    {userRole === 'tutor' ? 'Student:' : 'Tutor:'}
                  </strong>{' '}
                  {userRole === 'tutor' 
                    ? `${appointment.student.user.firstName} ${appointment.student.user.lastName}`
                    : `${appointment.tutor.user.firstName} ${appointment.tutor.user.lastName}`
                  }
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {isHydrated && format(parseISO(appointment.startTime), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Time:</strong> {isHydrated && format(parseISO(appointment.startTime), 'h:mm a')} - {isHydrated && format(parseISO(appointment.endTime), 'h:mm a')}
                </p>
                {appointment.notes && (
                  <p className="text-sm text-gray-600">
                    <strong>Notes:</strong> {appointment.notes}
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                {canReschedule(appointment) && (
                  <button
                    onClick={() => openRescheduleModal(appointment)}
                    className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors"
                  >
                    Reschedule
                  </button>
                )}
                {canMarkCompleted(appointment) && (
                  <button
                    onClick={() => handleMarkCompleted(appointment)}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    Complete
                  </button>
                )}
                {canCancel(appointment) && (
                  <button
                    onClick={() => openCancelModal(appointment)}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reschedule Appointment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={rescheduleSubject}
                  onChange={(e) => setRescheduleSubject(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add any notes about the reschedule..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Appointment</h3>
            
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel this appointment with{' '}
              {userRole === 'tutor' 
                ? `${selectedAppointment.student.user.firstName} ${selectedAppointment.student.user.lastName}`
                : `${selectedAppointment.tutor.user.firstName} ${selectedAppointment.tutor.user.lastName}`
              }{' '}
              on {isHydrated && format(parseISO(selectedAppointment.startTime), 'MMM d, yyyy')} at{' '}
              {isHydrated && format(parseISO(selectedAppointment.startTime), 'h:mm a')}?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}