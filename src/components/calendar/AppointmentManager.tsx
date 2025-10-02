'use client'

import React, { useState, useEffect } from 'react'
import { format, parseISO, addDays, isAfter } from 'date-fns'

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

interface AppointmentManagerProps {
  userRole: 'tutor' | 'student'
  userId: string
}

export default function AppointmentManager({ userRole, userId }: AppointmentManagerProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Reschedule form state
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleSubject, setRescheduleSubject] = useState('')
  const [rescheduleNotes, setRescheduleNotes] = useState('')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
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
    } finally {
      setLoading(false)
    }
  }

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

  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus === 'all') return true
    return apt.status === filterStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Appointment Management
          </h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">📅</div>
            <p className="text-gray-500">No appointments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const startTime = parseISO(appointment.startTime)
              const endTime = parseISO(appointment.endTime)
              const otherUser = userRole === 'tutor' ? appointment.student : appointment.tutor

              return (
                <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{appointment.subject}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <span className="w-16">📅 Date:</span>
                          <span>{format(startTime, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-16">⏰ Time:</span>
                          <span>{format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-16">👤 {userRole === 'tutor' ? 'Student' : 'Tutor'}:</span>
                          <span>{otherUser.user.firstName} {otherUser.user.lastName}</span>
                        </div>
                        {appointment.notes && (
                          <div className="flex items-start">
                            <span className="w-16">📝 Notes:</span>
                            <span className="flex-1">{appointment.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {canReschedule(appointment) && (
                        <button
                          onClick={() => openRescheduleModal(appointment)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Reschedule
                        </button>
                      )}
                      
                      {canMarkCompleted(appointment) && (
                        <button
                          onClick={() => handleMarkCompleted(appointment)}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                      
                      {canCancel(appointment) && (
                        <button
                          onClick={() => openCancelModal(appointment)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reschedule Appointment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={rescheduleSubject}
                  onChange={(e) => setRescheduleSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Add any notes about the reschedule..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRescheduleModal(false)
                  resetRescheduleForm()
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Appointment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
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