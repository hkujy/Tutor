import React, { useState, useEffect, useCallback } from 'react'
import { format, parseISO, addDays, isAfter, isToday, isBefore, startOfDay, endOfDay } from 'date-fns'
import { useTranslations } from 'next-intl'
import { APPOINTMENT_STATUS_MAP } from '../../constants'
import { useSocketEvent } from '../../hooks/useSocket'
import { SOCKET_EVENTS } from '../../lib/socket/socket-events'
import type { AppointmentEventData } from '../../lib/socket/socket-events'

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
  const t = useTranslations('AppointmentManagement')
  const tEnums = useTranslations('Enums')
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

  // Real-time event subscriptions
  useSocketEvent(SOCKET_EVENTS.APPOINTMENT_CREATED, useCallback((data: AppointmentEventData) => {
    console.log('Real-time: Appointment created', data)
    // Refresh appointments to get the new one with full details
    fetchAppointments()
  }, [fetchAppointments]))

  useSocketEvent(SOCKET_EVENTS.APPOINTMENT_UPDATED, useCallback((data: AppointmentEventData) => {
    console.log('Real-time: Appointment updated', data)
    // Update the specific appointment in the list
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === data.id
          ? {
            ...apt,
            startTime: data.startTime,
            endTime: data.endTime,
            subject: data.subject,
            status: data.status as any,
            _justUpdated: true // Mark for visual indicator
          }
          : apt
      )
    )

    // Remove the visual indicator after 3 seconds
    setTimeout(() => {
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === data.id ? { ...apt, _justUpdated: false } : apt
        )
      )
    }, 3000)
  }, []))

  useSocketEvent(SOCKET_EVENTS.APPOINTMENT_CANCELLED, useCallback((data: AppointmentEventData) => {
    console.log('Real-time: Appointment cancelled', data)
    // Update the appointment status to cancelled
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === data.id
          ? { ...apt, status: 'CANCELLED' as any, _justUpdated: true }
          : apt
      )
    )

    // Remove the visual indicator after 3 seconds
    setTimeout(() => {
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === data.id ? { ...apt, _justUpdated: false } : apt
        )
      )
    }, 3000)
  }, []))

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
          <h2 className="text-xl font-semibold text-gray-900">{t('title')}</h2>
          <p className="text-sm text-gray-600">
            {t('showingCount', { current: filteredAppointments.length, total: appointments.length })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">{t('filters.time.all')}</option>
            <option value="upcoming">{t('filters.time.upcoming')}</option>
            <option value="today">{t('filters.time.today')}</option>
            <option value="past">{t('filters.time.past')}</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">{t('filters.status.all')}</option>
            <option value="SCHEDULED">{tEnums(APPOINTMENT_STATUS_MAP['SCHEDULED'])}</option>
            <option value="CONFIRMED">{tEnums(APPOINTMENT_STATUS_MAP['CONFIRMED'])}</option>
            <option value="IN_PROGRESS">{tEnums(APPOINTMENT_STATUS_MAP['IN_PROGRESS'])}</option>
            <option value="COMPLETED">{tEnums(APPOINTMENT_STATUS_MAP['COMPLETED'])}</option>
            <option value="CANCELLED">{tEnums(APPOINTMENT_STATUS_MAP['CANCELLED'])}</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="date">{t('sort.date')}</option>
            <option value="subject">{t('sort.subject')}</option>
            <option value="status">{t('sort.status')}</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {t('view.list')}
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm border-l ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {t('view.grid')}
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('empty.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterStatus !== 'all' || timeFilter !== 'all'
              ? t('empty.filter')
              : t('empty.start')
            }
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {sortedAppointments.map((appointment) => (
              <li key={appointment.id} className={`px-4 sm:px-6 py-4 transition-all duration-300 ${(appointment as any)._justUpdated ? 'bg-green-50' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-0">
                      <div className="flex items-center space-x-2">
                        {(appointment as any)._justUpdated && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {tEnums(APPOINTMENT_STATUS_MAP[appointment.status] || 'status.scheduled')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {appointment.subject}
                      </p>
                    </div>

                    <div className="mt-1 sm:flex sm:justify-between">
                      <div className="text-sm text-gray-500 mb-2 sm:mb-0">
                        {userRole === 'tutor'
                          ? `${appointment.student.user.firstName} ${appointment.student.user.lastName}`
                          : `${appointment.tutor.user.firstName} ${appointment.tutor.user.lastName}`
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        {isHydrated && (
                          <>
                            <span className="block sm:inline">{format(parseISO(appointment.startTime), 'MMM d, yyyy')}</span>
                            <span className="hidden sm:inline mx-1">•</span>
                            <span className="block sm:inline">{format(parseISO(appointment.startTime), 'h:mm a')} - {format(parseISO(appointment.endTime), 'h:mm a')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {appointment.notes && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{appointment.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 mt-2 sm:mt-0">
                    {canReschedule(appointment) && (
                      <button
                        onClick={() => openRescheduleModal(appointment)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium p-2 -ml-2 hover:bg-indigo-50 rounded-md transition-colors"
                        aria-label={t('actions.reschedule')}
                      >
                        {t('actions.reschedule')}
                      </button>
                    )}
                    {canMarkCompleted(appointment) && (
                      <button
                        onClick={() => handleMarkCompleted(appointment)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium p-2 hover:bg-green-50 rounded-md transition-colors"
                        aria-label={t('actions.complete')}
                      >
                        {t('actions.complete')}
                      </button>
                    )}
                    {canCancel(appointment) && (
                      <button
                        onClick={() => openCancelModal(appointment)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium p-2 hover:bg-red-50 rounded-md transition-colors"
                        aria-label={t('actions.cancel')}
                      >
                        {t('actions.cancel')}
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
                  {tEnums(APPOINTMENT_STATUS_MAP[appointment.status] || 'status.scheduled')}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>
                    {userRole === 'tutor' ? t('labels.student') : t('labels.tutor')}
                  </strong>{' '}
                  {userRole === 'tutor'
                    ? `${appointment.student.user.firstName} ${appointment.student.user.lastName}`
                    : `${appointment.tutor.user.firstName} ${appointment.tutor.user.lastName}`
                  }
                </p>
                <p className="text-sm text-gray-600">
                  <strong>{t('labels.date')}</strong> {isHydrated && format(parseISO(appointment.startTime), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>{t('labels.time')}</strong> {isHydrated && format(parseISO(appointment.startTime), 'h:mm a')} - {isHydrated && format(parseISO(appointment.endTime), 'h:mm a')}
                </p>
                {appointment.notes && (
                  <p className="text-sm text-gray-600">
                    <strong>{t('labels.notes')}</strong> {appointment.notes}
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                {canReschedule(appointment) && (
                  <button
                    onClick={() => openRescheduleModal(appointment)}
                    className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors"
                  >
                    {t('actions.reschedule')}
                  </button>
                )}
                {canMarkCompleted(appointment) && (
                  <button
                    onClick={() => handleMarkCompleted(appointment)}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    {t('actions.complete')}
                  </button>
                )}
                {canCancel(appointment) && (
                  <button
                    onClick={() => openCancelModal(appointment)}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    {t('actions.cancel')}
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('modals.reschedule.title')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('modals.reschedule.date')}</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('modals.reschedule.time')}</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('modals.reschedule.subject')}</label>
                <input
                  type="text"
                  value={rescheduleSubject}
                  onChange={(e) => setRescheduleSubject(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('modals.reschedule.notes')}</label>
                <textarea
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={t('modals.reschedule.notesPlaceholder')}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={handleReschedule}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                {t('actions.reschedule')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('modals.cancel.title')}</h3>

            <p className="text-sm text-gray-600 mb-6">
              {t('modals.cancel.confirm', {
                name: userRole === 'tutor'
                  ? `${selectedAppointment.student.user.firstName} ${selectedAppointment.student.user.lastName}`
                  : `${selectedAppointment.tutor.user.firstName} ${selectedAppointment.tutor.user.lastName}`,
                date: isHydrated ? format(parseISO(selectedAppointment.startTime), 'MMM d, yyyy') : '',
                time: isHydrated ? format(parseISO(selectedAppointment.startTime), 'h:mm a') : ''
              })}
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                {t('modals.cancel.keep')}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                {t('modals.cancel.confirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
