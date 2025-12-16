'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameMonth, isToday, isSameDay, isAfter } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'

interface Student {
  id: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  gradeLevel?: string
  subjects: string[]
}

interface TimeSlot {
  time: string
  available: boolean
  conflictReason?: string
}

interface TutorAppointmentFormProps {
  onAppointmentCreated?: () => void
}

export default function TutorAppointmentForm({ onAppointmentCreated }: TutorAppointmentFormProps) {
  const { user } = useAuth()
  
  // Form steps
  const [step, setStep] = useState(1)
  
  // Form data
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  
  // Data state
  const [students, setStudents] = useState<Student[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`/api/tutors/${user?.tutorId}/students`)
      const data = await res.json()
      setStudents(data.students || [])
    } catch (error) {
      console.error('Failed to fetch students:', error)
      setStudents([])
    }
  }, [user?.tutorId])

  useEffect(() => {
    if (user?.tutorId) {
      fetchStudents()
    }
  }, [user, fetchStudents])

  const generateTimeSlots = useCallback(() => {
    const slots: TimeSlot[] = []
    
    // Generate time slots from 8 AM to 8 PM
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time: timeString,
          available: true, // In a real app, check against tutor availability and existing appointments
        })
      }
    }
    
    setAvailableSlots(slots)
  }, [])

  useEffect(() => {
    if (selectedDate && selectedStudent) {
      generateTimeSlots()
    }
  }, [selectedDate, selectedStudent, generateTimeSlots])

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
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
    if (!selectedStudent || !selectedDate || !selectedTime || !selectedSubject || !user?.tutorId) {
      setMessage('Please complete all required fields')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          subject: selectedSubject,
          studentId: selectedStudent.id,
          tutorId: user.tutorId,
          duration: duration,
          notes: notes || `Appointment created by tutor for ${selectedSubject} session`
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Appointment created successfully! Student will be notified.')
        setMessageType('success')
        resetForm()
        onAppointmentCreated?.()
      } else {
        setMessage(data.error || 'Failed to create appointment')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('An error occurred while creating the appointment')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedStudent(null)
    setSelectedSubject('')
    setSelectedDate(null)
    setSelectedTime('')
    setNotes('')
  }

  const generateCalendarDates = (month: Date) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }

  const calendarDates = currentMonth ? generateCalendarDates(currentMonth) : []

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

  if (!isHydrated) {
    return <div>Loading...</div>
  }

  // Step 1: Select Student & Subject
  if (step === 1) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create Appointment - Step 1</h3>
        
        {!selectedStudent ? (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Select a Student:</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {students.length > 0 ? students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {student.user.firstName} {student.user.lastName}
                      </h5>
                      <p className="text-sm text-gray-600">{student.user.email}</p>
                      {student.gradeLevel && (
                        <p className="text-sm text-gray-500">Grade: {student.gradeLevel}</p>
                      )}
                      <div className="mt-2">
                        <span className="text-sm text-gray-500">Subjects: </span>
                        <span className="text-sm text-gray-700">{student.subjects.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No students found. Students will appear here once they register and book their first appointment with you.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
              <p className="text-indigo-700">
                <strong>Selected Student:</strong> {selectedStudent.user.firstName} {selectedStudent.user.lastName}
              </p>
            </div>
            
            <h4 className="font-medium text-gray-700 mb-3">Select Subject:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedStudent.subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectSelect(subject)}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{subject}</span>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setSelectedStudent(null)}
              className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm"
            >
              ← Back to student selection
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create Appointment - Step 2</h3>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <p className="text-indigo-700">
            <strong>Student:</strong> {selectedStudent?.user.firstName} {selectedStudent?.user.lastName} | 
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
            <h4 className="text-lg font-semibold">
              {currentMonth && format(currentMonth, 'MMMM yyyy')}
            </h4>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDates.map((date, index) => {
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isPast = !isAfter(date, new Date()) && !isToday(date)
              
              return (
                <button
                  key={index}
                  onClick={() => !isPast && isCurrentMonth && handleDateSelect(date)}
                  disabled={isPast || !isCurrentMonth}
                  className={`
                    p-2 text-center text-sm transition-colors
                    ${isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}
                    ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}
                    ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    ${isToday(date) && !isSelected ? 'bg-indigo-100 text-indigo-600' : ''}
                  `}
                >
                  {format(date, 'd')}
                </button>
              )
            })}
          </div>
        </div>

        {selectedDate && (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">
              Select Time for {format(selectedDate, 'EEEE, MMMM d')}:
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`
                    p-2 text-sm rounded-lg border transition-colors
                    ${slot.available 
                      ? 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50' 
                      : 'border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Confirm
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Create Appointment - Confirm</h3>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Appointment Details:</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Student:</strong> {selectedStudent?.user.firstName} {selectedStudent?.user.lastName}</div>
          <div><strong>Email:</strong> {selectedStudent?.user.email}</div>
          <div><strong>Subject:</strong> {selectedSubject}</div>
          <div><strong>Date:</strong> {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</div>
          <div><strong>Time:</strong> {selectedTime}</div>
          <div><strong>Duration:</strong> {duration} minutes</div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration (minutes)
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value={30}>30 minutes</option>
          <option value={60}>60 minutes</option>
          <option value={90}>90 minutes</option>
          <option value={120}>2 hours</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Add any notes about this appointment..."
        />
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={() => setStep(2)}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Appointment'}
        </button>
      </div>
    </div>
  )
}