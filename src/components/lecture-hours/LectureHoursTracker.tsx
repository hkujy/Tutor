'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { SkeletonList } from '../ui/Skeleton'
import LoadingButton from '../ui/LoadingButton'

// Helper function for safe date formatting
const formatDateSafe = (dateValue: string | null | undefined, fallback: string = 'No date'): string => {
  if (!dateValue) return fallback
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return fallback
    return format(date, 'MMM d, yyyy')
  } catch (error) {
    return fallback
  }
}

interface LectureHours {
  id: string
  studentId: string
  tutorId: string
  subject: string
  totalHours: number
  unpaidHours: number
  paymentInterval: number
  student: {
    user: {
      firstName: string
      lastName: string
    }
  }
  tutor: {
    user: {
      firstName: string
      lastName: string
    }
  }
  sessions: LectureSession[]
  payments: Payment[]
}

interface LectureSession {
  id: string
  date: string | null
  duration: number
  notes?: string
}

interface Payment {
  id: string
  amount: number
  hoursIncluded: number
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  dueDate: string | null
  paidDate?: string | null
}

interface LectureHoursTrackerProps {
  userRole: 'student' | 'tutor'
  userId: string
}

export default function LectureHoursTracker({ userRole, userId }: LectureHoursTrackerProps) {
  const [lectureHours, setLectureHours] = useState<LectureHours[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<LectureHours | null>(null)
  const [recordingSession, setRecordingSession] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    lectureHoursId: '',
    duration: '',
    notes: ''
  })
  const [editingPaymentInterval, setEditingPaymentInterval] = useState<string | null>(null)
  const [newPaymentInterval, setNewPaymentInterval] = useState<number>(10)

  const fetchLectureHours = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/lecture-hours?userId=${userId}&role=${userRole}`)
      if (res.ok) {
        const data = await res.json()
        setLectureHours(data.lectureHours || [])
      }
    } catch (error) {
      console.error('Failed to fetch lecture hours:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, userRole])

  useEffect(() => {
    fetchLectureHours()
  }, [fetchLectureHours])

  const recordSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecordingSession(true)
    
    try {
      const res = await fetch('/api/lecture-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureHoursId: sessionForm.lectureHoursId,
          duration: parseFloat(sessionForm.duration),
          notes: sessionForm.notes
        })
      })

      if (res.ok) {
        setSessionForm({ lectureHoursId: '', duration: '', notes: '' })
        fetchLectureHours() // Refresh data
      }
    } catch (error) {
      console.error('Failed to record session:', error)
    } finally {
      setRecordingSession(false)
    }
  }

  const updatePaymentStatus = async (paymentId: string, status: 'PAID') => {
    try {
      const res = await fetch('/api/lecture-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          status,
          paidDate: new Date().toISOString()
        })
      })

      if (res.ok) {
        fetchLectureHours() // Refresh data
      }
    } catch (error) {
      console.error('Failed to update payment:', error)
    }
  }

  const updatePaymentInterval = async (lectureHoursId: string, paymentInterval: number) => {
    try {
      const res = await fetch('/api/lecture-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePaymentInterval',
          lectureHoursId,
          paymentInterval
        })
      })

      if (res.ok) {
        setEditingPaymentInterval(null)
        fetchLectureHours() // Refresh data
      }
    } catch (error) {
      console.error('Failed to update payment interval:', error)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <SkeletonList items={4} showAvatar={false} />
      </div>
    )
  }

  try {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {userRole === 'student' ? 'My Lecture Hours' : 'Student Lecture Hours'}
              </h2>
              <p className="text-gray-600 mt-1">
                {userRole === 'student' 
                  ? 'Track your lesson hours and payment status'
                  : 'Record sessions and track student progress'
                }
              </p>
          </div>
          {userRole === 'tutor' && (
            <button
              onClick={() => setSelectedRecord(null)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Record Session
            </button>
          )}
        </div>
      </div>

      {/* Session Recording Form (Tutors only) */}
      {userRole === 'tutor' && selectedRecord === null && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Record New Session</h3>
          <form onSubmit={recordSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student/Subject
              </label>
              <select
                value={sessionForm.lectureHoursId}
                onChange={(e) => setSessionForm({ ...sessionForm, lectureHoursId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select student and subject</option>
                {lectureHours.map((lh) => (
                  <option key={lh.id} value={lh.id}>
                    {lh.student.user.firstName} {lh.student.user.lastName} - {lh.subject}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="8"
                value={sessionForm.duration}
                onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={sessionForm.notes}
                onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <LoadingButton
                type="submit"
                loading={recordingSession}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Record Session
              </LoadingButton>
              <button
                type="button"
                onClick={() => setSessionForm({ lectureHoursId: '', duration: '', notes: '' })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lecture Hours Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lectureHours.map((lh) => (
          <div key={lh.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{lh.subject}</h3>
                <p className="text-sm text-gray-600">
                  {userRole === 'student' 
                    ? `Tutor: ${lh.tutor.user.firstName} ${lh.tutor.user.lastName}`
                    : `Student: ${lh.student.user.firstName} ${lh.student.user.lastName}`
                  }
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(selectedRecord?.id === lh.id ? null : lh)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Hours:</span>
                <span className="font-medium">{lh.totalHours.toFixed(1)}h</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unpaid Hours:</span>
                <span className={`font-medium ${lh.unpaidHours > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {lh.unpaidHours.toFixed(1)}h
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Frequency:</span>
                {userRole === 'tutor' && editingPaymentInterval === lh.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={newPaymentInterval}
                      onChange={(e) => setNewPaymentInterval(parseInt(e.target.value))}
                      className="w-16 px-2 py-1 text-sm border rounded"
                    />
                    <span className="text-sm">hours</span>
                    <button
                      onClick={() => updatePaymentInterval(lh.id, newPaymentInterval)}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingPaymentInterval(null)}
                      className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Every {lh.paymentInterval}h</span>
                    {userRole === 'tutor' && (
                      <button
                        onClick={() => {
                          setEditingPaymentInterval(lh.id)
                          setNewPaymentInterval(lh.paymentInterval)
                        }}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                        title="Edit payment frequency"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Status */}
              {lh.payments.length > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Latest Payment:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(lh.payments[0].status)}`}>
                      {lh.payments[0].status}
                    </span>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress to next payment</span>
                  <span>{(lh.unpaidHours % lh.paymentInterval).toFixed(1)}/{lh.paymentInterval}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (lh.unpaidHours % lh.paymentInterval) / lh.paymentInterval * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {lectureHours.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No lecture hours found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {userRole === 'tutor' 
              ? 'Start recording sessions to track lecture hours for your students.'
              : 'Your tutor will record sessions to track your lecture hours and payments.'
            }
          </p>
        </div>
      )}

      {/* Detailed View */}
      {selectedRecord && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {selectedRecord.subject} - Detailed View
            </h3>
            <button
              onClick={() => setSelectedRecord(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sessions */}
            <div>
              <h4 className="text-lg font-medium mb-4">Recent Sessions</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedRecord.sessions.slice(0, 10).map((session) => (
                  <div key={session.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {formatDateSafe(session.date)}
                        </p>
                        <p className="text-sm text-gray-600">{session.duration}h session</p>
                        {session.notes && (
                          <p className="text-sm text-gray-500 mt-1 italic">{session.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h4 className="text-lg font-medium mb-4">Payment History</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedRecord.payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">${payment.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{payment.hoursIncluded}h payment</p>
                        <p className="text-sm text-gray-500">
                          Due: {formatDateSafe(payment.dueDate, 'No due date')}
                        </p>
                        {payment.paidDate && (
                          <p className="text-sm text-green-600">
                            Paid: {formatDateSafe(payment.paidDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                        {payment.status === 'PENDING' && userRole === 'student' && (
                          <button
                            onClick={() => updatePaymentStatus(payment.id, 'PAID')}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  } catch (error) {
    console.error('Error rendering LectureHoursTracker:', error)
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-red-600">Error Loading Data</h3>
        <p className="text-gray-600">
          Sorry, there was an error loading the lecture hours data. Please refresh the page or try again later.
        </p>
      </div>
    )
  }
}