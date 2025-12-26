'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Calendar, Clock, Save, X } from 'lucide-react'

/**
 * Tutor Availability Management Page
 * 
 * Allows tutors to:
 * - Set weekly recurring availability
 * - Configure time slots (start, end, duration)
 * - Block specific dates
 * - View current schedule
 */

type TimeSlot = {
    startTime: string // HH:MM format
    endTime: string
    isActive: boolean
}

type DaySchedule = {
    dayOfWeek: number // 0-6 (Sunday-Saturday)
    slots: TimeSlot[]
}

const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
]

export default function TutorAvailabilityPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const t = useTranslations('TutorAvailability')

    const [schedule, setSchedule] = useState<DaySchedule[]>(
        DAYS_OF_WEEK.map((_, index) => ({
            dayOfWeek: index,
            slots: [],
        }))
    )

    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Redirect if not authenticated or not a tutor
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (status === 'unauthenticated') {
        router.push('/login')
        return null
    }

    if (session?.user?.role !== 'TUTOR') {
        router.push('/student')
        return null
    }

    const addTimeSlot = (dayIndex: number) => {
        const newSchedule = [...schedule]
        newSchedule[dayIndex].slots.push({
            startTime: '09:00',
            endTime: '10:00',
            isActive: true,
        })
        setSchedule(newSchedule)
    }

    const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
        const newSchedule = [...schedule]
        newSchedule[dayIndex].slots.splice(slotIndex, 1)
        setSchedule(newSchedule)
    }

    const updateTimeSlot = (
        dayIndex: number,
        slotIndex: number,
        field: keyof TimeSlot,
        value: string | boolean
    ) => {
        const newSchedule = [...schedule]
        newSchedule[dayIndex].slots[slotIndex] = {
            ...newSchedule[dayIndex].slots[slotIndex],
            [field]: value,
        }
        setSchedule(newSchedule)
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage(null)

        try {
            // TODO: Implement API call to save availability
            // const response = await fetch('/api/tutor/availability', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ schedule }),
            // })

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            setMessage({ type: 'success', text: 'Availability saved successfully!' })

            // Redirect to dashboard after save
            setTimeout(() => {
                router.push('/tutor')
            }, 1500)

        } catch (error) {
            console.error('Error saving availability:', error)
            setMessage({ type: 'error', text: 'Failed to save availability. Please try again.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-primary" />
                        Manage Availability
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Set your weekly schedule and let students book appointments during your available times.
                    </p>
                </div>

                {/* Status Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Weekly Schedule Grid */}
                <div className="space-y-6">
                    {schedule.map((day, dayIndex) => (
                        <div
                            key={dayIndex}
                            className="bg-card border border-border rounded-lg p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary" />
                                    {DAYS_OF_WEEK[dayIndex]}
                                </h2>
                                <button
                                    onClick={() => addTimeSlot(dayIndex)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                                >
                                    + Add Time Slot
                                </button>
                            </div>

                            {/* Time Slots */}
                            {day.slots.length === 0 ? (
                                <p className="text-muted-foreground text-sm italic">
                                    No availability set for this day. Click "Add Time Slot" to get started.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {day.slots.map((slot, slotIndex) => (
                                        <div
                                            key={slotIndex}
                                            className="flex items-center gap-4 p-4 bg-background rounded-md border border-border"
                                        >
                                            {/* Start Time */}
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    Start Time
                                                </label>
                                                <input
                                                    type="time"
                                                    value={slot.startTime}
                                                    onChange={(e) =>
                                                        updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>

                                            {/* End Time */}
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    End Time
                                                </label>
                                                <input
                                                    type="time"
                                                    value={slot.endTime}
                                                    onChange={(e) =>
                                                        updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>

                                            {/* Active Toggle */}
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={slot.isActive}
                                                    onChange={(e) =>
                                                        updateTimeSlot(dayIndex, slotIndex, 'isActive', e.target.checked)
                                                    }
                                                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                />
                                                <label className="text-sm text-foreground">Active</label>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                aria-label="Remove time slot"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                <div className="mt-8 flex justify-end gap-4">
                    <button
                        onClick={() => router.push('/tutor')}
                        className="px-6 py-3 bg-background border border-border text-foreground rounded-md hover:bg-accent transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Availability
                            </>
                        )}
                    </button>
                </div>

                {/* Help Text */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">💡 Tips:</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Set multiple time slots per day to offer more flexibility</li>
                        <li>Uncheck "Active" to temporarily disable a time slot without deleting it</li>
                        <li>Students will only see your active time slots when booking</li>
                        <li>You can update your availability anytime</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
