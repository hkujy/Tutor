'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { SkeletonTable, Skeleton } from '../ui/Skeleton'
import LoadingButton from '../ui/LoadingButton'
import { format } from 'date-fns'

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

interface TutorAvailabilityProps {
  tutorId: string
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

export default function TutorAvailability({ tutorId }: TutorAvailabilityProps) {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [individualSlots, setIndividualSlots] = useState<IndividualSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1) // Monday
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  
  // Add slot type state
  const [slotType, setSlotType] = useState<'individual' | 'repeating'>('individual')
  const [individualDate, setIndividualDate] = useState(new Date().toISOString().split('T')[0])
  
  // Recurring slot duration options
  const [recurringStartDate, setRecurringStartDate] = useState(new Date().toISOString().split('T')[0])
  const [recurringEndDate, setRecurringEndDate] = useState('')
  const [numberOfWeeks, setNumberOfWeeks] = useState(4)
  const [durationType, setDurationType] = useState<'endDate' | 'numberOfWeeks'>('numberOfWeeks')
  
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const fetchAvailability = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/availability?tutorId=${tutorId}`)
      const data = await res.json()
      
      // Handle new API response format
      if (data.availability && typeof data.availability === 'object') {
        if (data.availability.recurring && data.availability.individual) {
          // New format with both types
          setAvailability(data.availability.recurring || [])
          
          // Normalize individual slot dates to ensure consistent format
          const normalizedIndividualSlots = (data.availability.individual || []).map((slot: any) => ({
            ...slot,
            date: slot.date.includes('T') ? slot.date.split('T')[0] : slot.date
          }))
          setIndividualSlots(normalizedIndividualSlots)
        } else {
          // Legacy format - just recurring slots
          setAvailability(data.availability || [])
          setIndividualSlots([])
        }
      } else {
        // Legacy array format
        setAvailability(data.availability || [])
        setIndividualSlots([])
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error)
    } finally {
      setLoading(false)
    }
  }, [tutorId])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 6; hour <= 22; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`
      slots.push(timeString)
      if (hour < 22) {
        const halfHourString = `${hour.toString().padStart(2, '0')}:30`
        slots.push(halfHourString)
      }
    }
    return slots
  }

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      let requestData: any
      
      if (slotType === 'individual') {
        // Individual slot using specific date
        requestData = {
          tutorId,
          date: individualDate,
          startTime,
          endTime,
          slotType: 'individual'
        }
      } else {
        // Recurring slot using day of week with duration
        requestData = {
          tutorId,
          dayOfWeek: selectedDay,
          startTime,
          endTime,
          slotType: 'repeating',
          startDate: recurringStartDate,
          ...(durationType === 'numberOfWeeks' 
            ? { numberOfWeeks } 
            : { endDate: recurringEndDate }
          )
        }
      }

      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const data = await res.json()

      if (res.ok) {
        const slotTypeText = slotType === 'individual' ? 'Individual' : 'Recurring'
        setMessage(`${slotTypeText} availability slot added successfully!`)
        setMessageType('success')
        setShowForm(false)
        fetchAvailability()
        // Reset form
        setSelectedDay(1)
        setStartTime('09:00')
        setEndTime('17:00')
        setSlotType('repeating')
        setIndividualDate(new Date().toISOString().split('T')[0])
        setRecurringStartDate(new Date().toISOString().split('T')[0])
        setRecurringEndDate('')
        setNumberOfWeeks(4)
        setDurationType('numberOfWeeks')
      } else {
        setMessage(data.error || 'Failed to add availability slot')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Failed to add availability slot')
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleAvailability = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive })
      })

      if (res.ok) {
        fetchAvailability()
      }
    } catch (error) {
      console.error('Failed to toggle availability:', error)
    }
  }

  const handleDeleteAvailability = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return
    }

    try {
      const res = await fetch(`/api/availability?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchAvailability()
        setMessage('Availability slot deleted successfully!')
        setMessageType('success')
      }
    } catch (error) {
      console.error('Failed to delete availability:', error)
      setMessage('Failed to delete availability slot')
      setMessageType('error')
    }
  }

  const handleToggleIndividualSlot = async (id: string, available: boolean) => {
    try {
      const res = await fetch('/api/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          available: !available,
          slotType: 'individual'
        })
      })

      if (res.ok) {
        fetchAvailability()
      }
    } catch (error) {
      console.error('Failed to toggle individual slot:', error)
    }
  }

  const handleDeleteIndividualSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this individual slot?')) {
      return
    }

    try {
      const res = await fetch(`/api/availability?id=${id}&slotType=individual`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchAvailability()
        setMessage('Individual slot deleted successfully!')
        setMessageType('success')
      }
    } catch (error) {
      console.error('Failed to delete individual slot:', error)
      setMessage('Failed to delete individual slot')
      setMessageType('error')
    }
  }

  const groupAvailabilityByDay = () => {
    const grouped: { [key: number]: Availability[] } = {}
    availability.forEach(slot => {
      if (!grouped[slot.dayOfWeek]) {
        grouped[slot.dayOfWeek] = []
      }
      grouped[slot.dayOfWeek].push(slot)
    })
    return grouped
  }

  const timeSlots = generateTimeSlots()
  const groupedAvailability = groupAvailabilityByDay()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton width={200} height={24} className="bg-gray-300" />
          <Skeleton width={120} height={36} />
        </div>
        <SkeletonTable rows={7} columns={4} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Weekly Availability</h3>
        <LoadingButton
          onClick={() => setShowForm(!showForm)}
          variant="primary"
          size="sm"
        >
          {showForm ? 'Cancel' : 'Add Time Slot'}
        </LoadingButton>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddAvailability} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-medium mb-4">Add New Availability Slot</h4>
          
          {/* Slot Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Slot Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="repeating"
                  checked={slotType === 'repeating'}
                  onChange={(e) => setSlotType(e.target.value as 'repeating' | 'individual')}
                  className="mr-2"
                />
                Repeating (weekly)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="individual"
                  checked={slotType === 'individual'}
                  onChange={(e) => setSlotType(e.target.value as 'repeating' | 'individual')}
                  className="mr-2"
                />
                Individual slot
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conditional Day/Date Selection */}
            <div>
              {slotType === 'repeating' ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DAYS_OF_WEEK.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={individualDate}
                    onChange={(e) => setIndividualDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>
                    {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {timeSlots.filter(time => time > startTime).map(time => (
                  <option key={time} value={time}>
                    {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Duration Section for Recurring Slots */}
          {slotType === 'repeating' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="text-md font-medium text-gray-900 mb-3">Recurring Duration</h5>
              
              {/* Duration Type Selection */}
              <div className="mb-4">
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="numberOfWeeks"
                      checked={durationType === 'numberOfWeeks'}
                      onChange={(e) => setDurationType(e.target.value as 'endDate' | 'numberOfWeeks')}
                      className="mr-2"
                    />
                    Number of weeks
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="endDate"
                      checked={durationType === 'endDate'}
                      onChange={(e) => setDurationType(e.target.value as 'endDate' | 'numberOfWeeks')}
                      className="mr-2"
                    />
                    End date
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={recurringStartDate}
                    onChange={(e) => setRecurringStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                {durationType === 'numberOfWeeks' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Weeks</label>
                    <select
                      value={numberOfWeeks}
                      onChange={(e) => setNumberOfWeeks(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 26, 52].map(weeks => (
                        <option key={weeks} value={weeks}>
                          {weeks} week{weeks !== 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                      min={recurringStartDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
                
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    {durationType === 'numberOfWeeks' 
                      ? `Will create ${numberOfWeeks} weekly slots` 
                      : recurringEndDate 
                        ? `Until ${format(new Date(recurringEndDate), 'MMM d, yyyy')}`
                        : 'Select an end date'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex gap-2">
            <LoadingButton
              type="submit"
              loading={submitting}
              loadingText="Adding..."
              variant="primary"
            >
              Add Slot
            </LoadingButton>
            <LoadingButton
              type="button"
              onClick={() => setShowForm(false)}
              variant="secondary"
            >
              Cancel
            </LoadingButton>
          </div>
        </form>
      )}

      {/* Individual Slots */}
      {individualSlots.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Individual Slots</h3>
          <div className="space-y-2">
            {individualSlots
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(slot => (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between p-3 rounded-md border ${
                    slot.available ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      slot.available ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium">
                      {format(new Date(slot.date), 'MMM d, yyyy')} - {' '}
                      {format(new Date(`2000-01-01T${slot.startTime}`), 'h:mm a')} - {' '}
                      {format(new Date(`2000-01-01T${slot.endTime}`), 'h:mm a')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      slot.available 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {slot.available ? 'Available' : 'Unavailable'}
                    </span>
                    {slot.reason && (
                      <span className="text-xs text-gray-600">({slot.reason})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleIndividualSlot(slot.id, slot.available)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        slot.available
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      {slot.available ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button
                      onClick={() => handleDeleteIndividualSlot(slot.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recurring Availability Schedule */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Recurring Slots</h3>
        {DAYS_OF_WEEK.map((dayName, dayIndex) => (
          <div key={dayIndex} className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">{dayName}</h4>
            {groupedAvailability[dayIndex]?.length > 0 ? (
              <div className="space-y-2">
                {groupedAvailability[dayIndex]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(slot => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        slot.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          slot.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium">
                          {format(new Date(`2000-01-01T${slot.startTime}`), 'h:mm a')} - {' '}
                          {format(new Date(`2000-01-01T${slot.endTime}`), 'h:mm a')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          slot.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {slot.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleAvailability(slot.id, slot.isActive)}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            slot.isActive
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {slot.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteAvailability(slot.id)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No availability set for this day</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}