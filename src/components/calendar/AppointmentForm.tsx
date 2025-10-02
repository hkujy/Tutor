'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'

interface AppointmentFormProps {
  onAppointmentCreated?: () => void
  selectedDate?: Date | null
}

export default function AppointmentForm({ onAppointmentCreated, selectedDate }: AppointmentFormProps) {
  const [date, setDate] = useState(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '')
  const [time, setTime] = useState('')
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState('60')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      // Using actual tutor and student IDs from seeded data
      const studentId = 'cmg7x6nay0002lp7ctih1zrz3'
      const tutorId = 'cmg7z5uy90003lvjgzvfa50hg'
      
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          time,
          subject,
          studentId,
          tutorId,
          duration: parseInt(duration)
        }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage('Appointment booked successfully!')
        setMessageType('success')
        // Reset form
        setDate(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '')
        setTime('')
        setSubject('')
        setDuration('60')
        // Notify parent component
        onAppointmentCreated?.()
      } else {
        setMessage(data.error || 'Failed to book appointment')
        setMessageType('error')
      }
    } catch (err) {
      setMessage('Failed to book appointment. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // Generate time slots (9 AM to 5 PM, 30-minute intervals)
  const timeSlots = []
  for (let hour = 9; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeSlots.push(timeString)
    }
  }

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
    'Computer Science',
    'Economics',
    'Literature',
    'Other'
  ]

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-900">Book New Appointment</h3>
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <select 
              value={time} 
              onChange={e => setTime(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              required
            >
              <option value="">Select a time</option>
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>
                  {format(new Date(`2000-01-01T${slot}`), 'h:mm a')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              required
            >
              <option value="">Select a subject</option>
              {subjects.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <select 
              value={duration} 
              onChange={e => setDuration(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !date || !time || !subject} 
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Booking...
            </div>
          ) : (
            'Book Appointment'
          )}
        </button>

        {message && (
          <div className={`p-4 rounded-md ${messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {messageType === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
