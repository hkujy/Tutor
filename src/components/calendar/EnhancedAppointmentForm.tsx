'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay
} from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'
import { SkeletonList, Skeleton } from '../ui/skeleton'
import LoadingButton from '../ui/LoadingButton'

interface TimeSlot {
  time: string
  available: boolean
  conflictReason?: string
}

interface Tutor {
  id: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  subjects: string[]
  hourlyRate: number
}

interface Availability {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  subject: string
}

interface EnhancedAppointmentFormProps {
  onAppointmentCreated?: () => void
  initialDate?: Date | null
}

export default function EnhancedAppointmentForm({ onAppointmentCreated, initialDate }: EnhancedAppointmentFormProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1) // 1: Select Tutor & Subject, 2: Select Date & Time, 3: Confirm

  // Form state
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null)
  const [selectedTime, setSelectedTime] = useState('')
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')

  // Calendar navigation state
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Initialize date after hydration to avoid SSR mismatch
  useEffect(() => {
    setCurrentMonth(new Date())
    setIsHydrated(true)
  }, [])

  // Data state
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [existingAppointments, setExistingAppointments] = useState<any[]>([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // Mock tutors data (in real app this would come from API)
  const mockTutors: Tutor[] = [
    {
      id: 'cmg7z5uy90003lvjgzvfa50hg',
      user: { firstName: 'John', lastName: 'Smith', email: 'tutor@example.com' },
      subjects: ['Music'],
      hourlyRate: 50
    },
    {
      id: 'mock-tutor-2',
      user: { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@example.com' },
      subjects: ['Music'],
      hourlyRate: 45
    },
    {
      id: 'mock-tutor-3',
      user: { firstName: 'Mike', lastName: 'Chen', email: 'mike@example.com' },
      subjects: ['Music'],
      hourlyRate: 60
    }
  ]

  useEffect(() => {
    fetchTutors()
    fetchExistingAppointments()
  }, [])

  const fetchTutors = async () => {
    try {
      const res = await fetch('/api/tutors')
      const data = await res.json()
      setTutors(data.tutors || [])
    } catch (error) {
      console.error('Failed to fetch tutors:', error)
      // Fallback to empty array if API fails
      setTutors([])
    }
  }

  useEffect(() => {
    const generateTimeSlots = () => {
      if (!selectedDate || !selectedTutor) return

      const slots: TimeSlot[] = []
      const dayOfWeek = selectedDate.getDay()

      // Generate time slots from 8 AM to 6 PM
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          const slotDateTime = new Date(selectedDate)
          slotDateTime.setHours(hour, minute, 0, 0)

          // Check if slot is in the past
          if (slotDateTime < new Date()) {
            continue
          }

          // Check for conflicts with existing appointments
          const hasConflict = existingAppointments.some(apt => {
            const aptStart = new Date(apt.startTime)
            const aptEnd = new Date(apt.endTime)
            const slotEnd = new Date(slotDateTime.getTime() + duration * 60 * 1000)

            return apt.tutorId === selectedTutor.id &&
              apt.status !== 'CANCELLED' &&
              ((slotDateTime >= aptStart && slotDateTime < aptEnd) ||
                (slotEnd > aptStart && slotEnd <= aptEnd) ||
                (slotDateTime <= aptStart && slotEnd >= aptEnd))
          })

          slots.push({
            time: timeString,
            available: !hasConflict,
            conflictReason: hasConflict ? 'Already booked' : undefined
          })
        }
      }

      setAvailableSlots(slots)
    }

    if (selectedTutor && selectedDate && selectedSubject) {
      generateTimeSlots()
    }
  }, [selectedTutor, selectedDate, selectedSubject, existingAppointments, duration])

  const fetchExistingAppointments = async () => {
    try {
      const res = await fetch('/api/appointments')
      const data = await res.json()
      setExistingAppointments(data.appointments || [])
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    }
  }

  const handleTutorSelect = (tutor: Tutor) => {
    setSelectedTutor(tutor)
    setSelectedSubject('')
  }

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject)
    setStep(2)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime('')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep(3)
  }

  const handleSubmit = async () => {
    if (!selectedTutor || !selectedDate || !selectedTime || !selectedSubject || !user) {
      setMessage('Please complete all required fields')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // Get the appropriate student and tutor IDs
      let studentId: string
      let tutorId: string

      if (user.role === 'STUDENT') {
        if (!user.studentId) {
          setMessage('Student profile not found. Please contact support.')
          setMessageType('error')
          return
        }
        studentId = user.studentId
        tutorId = selectedTutor.id
      } else if (user.role === 'TUTOR') {
        if (!user.tutorId) {
          setMessage('Tutor profile not found. Please contact support.')
          setMessageType('error')
          return
        }
        tutorId = user.tutorId
        // For tutors creating appointments, we'd need a way to select the student
        // For now, this is designed for students booking appointments
        setMessage('Appointment creation from tutor interface not yet implemented.')
        setMessageType('error')
        return
      } else {
        setMessage('Invalid user role for booking appointments.')
        setMessageType('error')
        return
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          subject: selectedSubject,
          studentId,
          tutorId,
          duration: duration
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Appointment booked successfully!')
        setMessageType('success')
        resetForm()
        onAppointmentCreated?.()
      } else {
        setMessage(data.error || 'Failed to book appointment')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('An error occurred while booking the appointment')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedTutor(null)
    setSelectedSubject('')
    setSelectedDate(null)
    setSelectedTime('')
    setNotes('')
  }

  // Generate calendar dates for the current month
  const generateCalendarDates = (month: Date) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)

    // Include dates from the beginning of the first week to the end of the last week
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }

  // Get calendar dates for the current month
  const calendarDates = currentMonth ? generateCalendarDates(currentMonth) : []

  // Helper functions for calendar navigation
  const goToPreviousMonth = () => {
    if (currentMonth) {
      setCurrentMonth(subMonths(currentMonth, 1))
    }
  }

  const goToNextMonth = () => {
    if (currentMonth) {
      setCurrentMonth(addMonths(currentMonth, 1))
    }
  }

  // Step 1: Select Tutor & Subject
  if (step === 1) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Book an Appointment - Step 1</h3>

        {!selectedTutor ? (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Select a Tutor:</h4>
            <div className="space-y-3">
              {tutors.map((tutor) => (
                <div
                  key={tutor.id}
                  onClick={() => handleTutorSelect(tutor)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {tutor.user.firstName} {tutor.user.lastName}
                      </h5>
                      <p className="text-sm text-gray-600">{tutor.user.email}</p>
                      <div className="mt-2">
                        <span className="text-sm text-gray-500">Subjects: </span>
                        <span className="text-sm text-gray-700">{tutor.subjects.join(', ')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-green-600">${tutor.hourlyRate}/hr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-900">Selected Tutor:</h4>
              <p className="text-indigo-700">{selectedTutor.user.firstName} {selectedTutor.user.lastName}</p>
            </div>

            <h4 className="font-medium text-gray-700 mb-3">Select a Subject:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedTutor.subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectSelect(subject)}
                  className="p-3 border border-gray-200 rounded-lg text-left hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  {subject}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedTutor(null)}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-500"
            >
              ← Change tutor
            </button>
          </div>
        )}
      </div>
    )
  }

  // Step 2: Select Date & Time
  if (step === 2) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Book an Appointment - Step 2</h3>

        <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
          <p className="text-indigo-700">
            <strong>Tutor:</strong> {selectedTutor?.user.firstName} {selectedTutor?.user.lastName} |
            <strong> Subject:</strong> {selectedSubject}
          </p>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Select Date:</h4>

          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h5 className="text-lg font-medium text-gray-900">
              {currentMonth ? format(currentMonth, 'MMMM yyyy') : 'Loading...'}
            </h5>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDates.map((date) => {
              const isCurrentMonth = currentMonth ? isSameMonth(date, currentMonth) : false
              const isToday_ = isToday(date)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              // Avoid hydration mismatch by only calculating isPast after hydration
              const isPast = isHydrated && (date < new Date() && !isToday_)

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => !isPast && handleDateSelect(date)}
                  disabled={isPast}
                  className={`p-3 text-center rounded-lg border transition-colors min-h-[48px] ${isPast
                      ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                      : isSelected
                        ? 'border-indigo-500 bg-indigo-100 text-indigo-700'
                        : isToday_
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-600 font-medium'
                          : isCurrentMonth
                            ? 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-900'
                            : 'border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                >
                  <div className="text-sm">{format(date, 'd')}</div>
                </button>
              )
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Select Time:</h4>
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`p-2 text-sm rounded border transition-colors ${slot.available
                      ? selectedTime === slot.time
                        ? 'border-indigo-500 bg-indigo-100 text-indigo-700'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  title={slot.conflictReason}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            ← Back
          </button>
          {selectedTime && (
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    )
  }

  // Step 3: Confirm
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Book an Appointment - Confirm</h3>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Appointment Details:</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Tutor:</strong> {selectedTutor?.user.firstName} {selectedTutor?.user.lastName}</div>
          <div><strong>Subject:</strong> {selectedSubject}</div>
          <div><strong>Date:</strong> {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</div>
          <div><strong>Time:</strong> {selectedTime}</div>
          <div><strong>Duration:</strong> {duration} minutes</div>
          <div><strong>Cost:</strong> ${selectedTutor && (selectedTutor.hourlyRate * (duration / 60)).toFixed(2)}</div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="Any specific topics or requests..."
        />
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
          {message}
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={() => setStep(2)}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          ← Back
        </button>
        <LoadingButton
          onClick={handleSubmit}
          loading={loading}
          loadingText="Booking..."
          variant="primary"
        >
          Book Appointment
        </LoadingButton>
        <button
          onClick={resetForm}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}