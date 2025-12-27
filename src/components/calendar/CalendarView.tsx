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
    <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
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
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date) => {
            const dayAppointments = getAppointmentsForDate(date)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isToday = isSameDay(date, new Date())
            const isCurrentMonth = currentDate && date.getMonth() === currentDate.getMonth()

            return (
              <div
                key={format(date, 'yyyy-MM-dd')}
                onClick={() => handleDateClick(date)}
                className={`
                  h-24 p-2 border cursor-pointer rounded-md transition-all duration-200
                  ${isSelected
                    ? 'bg-primary/10 border-primary ring-1 ring-primary/20'
                    : 'border-border hover:bg-accent/50 hover:border-accent-foreground/20'}
                  ${isToday ? 'bg-blue-500/10 border-blue-500/50' : ''}
                  ${!isCurrentMonth ? 'opacity-40 grayscale-[0.5]' : ''}
                `}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-blue-500 font-bold' :
                  !isCurrentMonth ? 'text-muted-foreground' :
                    'text-foreground'
                  }`}>
                  {format(date, 'd')}
                </div>
                {dayAppointments.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/20 text-primary-foreground font-medium truncate border border-primary/20"
                      >
                        {apt.subject}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-[10px] text-muted-foreground font-medium pl-1">
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
        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
          <h3 className="text-lg font-medium text-foreground mb-3">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          {getAppointmentsForDate(selectedDate).length === 0 ? (
            <p className="text-muted-foreground text-sm italic">No appointments scheduled for this date.</p>
          ) : (
            <div className="space-y-2">
              {getAppointmentsForDate(selectedDate).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-card rounded-md border border-border hover:border-primary/50 transition-colors shadow-sm">
                  <div>
                    <h4 className="font-semibold text-foreground">{apt.subject}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(apt.startTime), 'h:mm a')} - {format(new Date(apt.endTime), 'h:mm a')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${apt.status === 'SCHEDULED' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                    apt.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                      'bg-muted text-muted-foreground border border-border'
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