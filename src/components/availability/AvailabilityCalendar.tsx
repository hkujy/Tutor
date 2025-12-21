'use client'

import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, startOfWeek, endOfWeek, getDay } from 'date-fns'
import { useTranslations } from 'next-intl'

interface Availability {
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    isActive: boolean
}

interface IndividualSlot {
    id: string
    date: string
    startTime: string
    endTime: string
    available: boolean
    reason?: string
}

interface AvailabilityCalendarProps {
    recurringSlots: Availability[]
    individualSlots: IndividualSlot[]
    onDateClick: (date: Date) => void
    selectedDate: Date | null
}

export default function AvailabilityCalendar({
    recurringSlots,
    individualSlots,
    onDateClick,
    selectedDate,
}: AvailabilityCalendarProps) {
    const t = useTranslations('TutorAvailability')
    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    }

    // Pre-calculate slots for each day in the calendar view
    const getSlotsForDate = (date: Date) => {
        const dayOfWeek = getDay(date)
        const dayRecurring = recurringSlots.filter(s => s.dayOfWeek === dayOfWeek && s.isActive)
        const dayIndividual = individualSlots.filter(s => isSameDay(new Date(s.date), date))

        return {
            recurring: dayRecurring,
            individual: dayIndividual
        }
    }

    if (!isHydrated) {
        return (
            <div className="bg-white rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading Calendar...</div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                    {format(currentDate, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors border"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 border border-indigo-200 transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => navigateMonth('next')}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors border"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-px mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date) => {
                    const { recurring, individual } = getSlotsForDate(date)
                    const isSelected = selectedDate && isSameDay(date, selectedDate)
                    const isToday = isSameDay(date, new Date())
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth()

                    return (
                        <div
                            key={format(date, 'yyyy-MM-dd')}
                            onClick={() => onDateClick(date)}
                            className={`
                min-h-[80px] p-1 border cursor-pointer rounded-md transition-all
                ${isSelected ? 'ring-2 ring-indigo-500 border-transparent bg-indigo-50/30' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}
                ${isToday ? 'bg-blue-50/50' : ''}
                ${!isCurrentMonth ? 'opacity-40 bg-gray-50/50' : ''}
              `}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isToday ? 'bg-blue-600 text-white' :
                                        isSelected ? 'bg-indigo-600 text-white' :
                                            'text-gray-700'
                                    }`}>
                                    {format(date, 'd')}
                                </span>
                            </div>

                            <div className="mt-1 space-y-0.5 overflow-hidden">
                                {/* Recurring indicator */}
                                {recurring.length > 0 && (
                                    <div className="flex flex-wrap gap-0.5">
                                        {recurring.map(r => (
                                            <div key={r.id} className="h-1.5 w-1.5 rounded-full bg-green-500" title={`Recurring Slot: ${r.startTime}-${r.endTime}`} />
                                        ))}
                                    </div>
                                )}

                                {/* Individual slots indicator */}
                                {individual.length > 0 && (
                                    <div className="flex flex-wrap gap-0.5">
                                        {individual.map(i => (
                                            <div key={i.id} className={`h-1.5 w-1.5 rounded-full ${i.available ? 'bg-blue-500' : 'bg-red-400'}`} title={`Individual Slot: ${i.startTime}-${i.endTime} (${i.available ? 'Available' : 'Unavailable'})`} />
                                        ))}
                                    </div>
                                )}

                                {/* Text summary for larger slots if room */}
                                <div className="hidden sm:block">
                                    {recurring.length > 0 && (
                                        <div className="text-[10px] text-green-700 truncate font-medium">
                                            {recurring.length} recurring
                                        </div>
                                    )}
                                    {individual.length > 0 && (
                                        <div className="text-[10px] text-blue-700 truncate font-medium">
                                            {individual.length} individual
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 border-t pt-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>{t('slotType.repeating')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{t('slotType.individual')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span>{t('status.unavailable')}</span>
                </div>
            </div>
        </div>
    )
}
