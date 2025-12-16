'use client'

import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, startOfWeek, endOfWeek } from 'date-fns'

interface Appointment {
  id: string
  startTime: string
  endTime: string
  subject: string
  status: string
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  // Initialize date after hydration to avoid SSR mismatch
  useEffect(() => {
    setCurrentDate(new Date())
    setIsHydrated(true)
  }, [])

  const monthStart = currentDate ? startOfMonth(currentDate) : null
  const monthEnd = currentDate ? endOfMonth(currentDate) : null
  
  // Get the start and end of the calendar view (including partial weeks)
  const calendarStart = monthStart ? startOfWeek(monthStart, { weekStartsOn: 0 }) : null // Sunday = 0
  const calendarEnd = monthEnd ? endOfWeek(monthEnd, { weekStartsOn: 0 }) : null
  
  const calendarDays = calendarStart && calendarEnd ? eachDayOfInterval({ start: calendarStart, end: calendarEnd }) : []

  useEffect(() => {
    if (currentDate) {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
      fetchAppointments(start, end)
    }
  }, [currentDate])

  const fetchAppointments = async (start: Date, end: Date) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      })
      const res = await fetch(`/api/appointments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.startTime), date)
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (currentDate) {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    }
  }

  // Show loading state during hydration
  if (!isHydrated || !currentDate) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading calendar...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const dayAppointments = getAppointmentsForDate(date)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isToday = isSameDay(date, new Date())
            const isCurrentMonth = currentDate && date.getMonth() === currentDate.getMonth()

            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  h-24 p-2 border cursor-pointer rounded-md transition-colors
                  ${isSelected ? 'bg-indigo-100 border-indigo-500' : 'border-gray-200 hover:bg-gray-50'}
                  ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                  ${!isCurrentMonth ? 'bg-gray-50' : ''}
                `}
              >
                <div className={`text-sm font-medium ${
                  isToday ? 'text-blue-600' : 
                  !isCurrentMonth ? 'text-gray-400' : 
                  'text-gray-900'
                }`}>
                  {format(date, 'd')}
                </div>
                {dayAppointments.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayAppointments.slice(0, 2).map((apt, i) => (
                      <div
                        key={i}
                        className="text-xs p-1 rounded bg-indigo-100 text-indigo-800 truncate"
                      >
                        {apt.subject}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayAppointments.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          {getAppointmentsForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500">No appointments scheduled for this date.</p>
          ) : (
            <div className="space-y-2">
              {getAppointmentsForDate(selectedDate).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <h4 className="font-medium text-gray-900">{apt.subject}</h4>
                    <p className="text-sm text-gray-500">
                      {format(new Date(apt.startTime), 'h:mm a')} - {format(new Date(apt.endTime), 'h:mm a')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    apt.status === 'SCHEDULED' ? 'bg-green-100 text-green-800' :
                    apt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}