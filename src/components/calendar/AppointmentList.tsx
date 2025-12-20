import React, { useState, useEffect, useCallback } from 'react'
import { format, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'
import { SkeletonList } from '../ui/Skeleton'
import { APPOINTMENT_STATUS_MAP } from '../../constants'

interface Appointment {
  id: string
  startTime: string
  endTime: string
  subject: string
  status: string
  notes?: string
}

interface AppointmentListProps {
  refreshTrigger?: number
}

export default function AppointmentList({ refreshTrigger }: AppointmentListProps) {
  const t = useTranslations('AppointmentList')
  const tEnums = useTranslations('Enums')
  const currentLocale = useLocale()
  const dateLocale = currentLocale === 'zh' ? zhCN : enUS
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'today'>('upcoming')
  const [sortBy, setSortBy] = useState<'date' | 'subject' | 'status'>('date')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10) // You can make this configurable
  const [totalAppointments, setTotalAppointments] = useState(0)
  const totalPages = Math.ceil(totalAppointments / itemsPerPage)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('page', currentPage.toString())
      queryParams.append('limit', itemsPerPage.toString())

      // Pass existing filters if needed, or implement them on API side later
      // For now, API handles basic date filters from dashboard
      // Assuming API handles 'upcoming', 'past', 'today' logic based on current date if needed.
      // If client-side filter is still desired, apply it to the data received from API
      
      const res = await fetch(`/api/appointments?${queryParams.toString()}`)
      const data = await res.json()
      
      setAppointments(data.appointments || [])
      setTotalAppointments(data.total || 0)
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      setAppointments([])
      setTotalAppointments(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage]) // Dependencies for useCallback

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments, refreshTrigger]) // Added fetchAppointments to dependency array

  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Initialize current time after hydration to avoid SSR mismatch
  useEffect(() => {
    setCurrentTime(new Date())
    setIsHydrated(true)
  }, [])

  // Client-side filtering and sorting for the current page of data
  // (API should ideally do most filtering, but client-side fine for simple cases)
  const getDisplayedAppointments = () => {
    if (!currentTime) return appointments
    
    let filtered = appointments
    const now = currentTime;

    // Apply client-side filters if the API doesn't fully support them yet
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(apt => isAfter(new Date(apt.startTime), now))
        break
      case 'past':
        filtered = filtered.filter(apt => isBefore(new Date(apt.startTime), now))
        break
      case 'today':
        filtered = filtered.filter(apt => {
          const aptDate = new Date(apt.startTime)
          return isAfter(aptDate, startOfDay(now)) && isBefore(aptDate, endOfDay(now))
        })
        break
      default:
        // 'all' means no client-side time filter
        break
    }

    // Sort appointments client-side based on sortBy
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        case 'subject':
          return a.subject.localeCompare(b.subject)
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })
  }
  const displayedAppointments = getDisplayedAppointments();


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'CONFIRMED':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'COMPLETED':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'CANCELLED':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <SkeletonList items={6} showAvatar={false} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">{t('title')}</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{t('filters.all')}</option>
            <option value="upcoming">{t('filters.upcoming')}</option>
            <option value="today">{t('filters.today')}</option>
            <option value="past">{t('filters.past')}</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="date">{t('sort.date')}</option>
            <option value="subject">{t('sort.subject')}</option>
            <option value="status">{t('sort.status')}</option>
          </select>
        </div>
      </div>

      {displayedAppointments.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('empty.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'upcoming' ? t('empty.upcoming') :
             filter === 'today' ? t('empty.today') :
             filter === 'past' ? t('empty.past') :
             t('empty.all')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedAppointments.map((apt) => {
            const startTime = new Date(apt.startTime)
            const endTime = new Date(apt.endTime)
            // Avoid hydration mismatch by only calculating isUpcoming after hydration
            const isUpcoming = currentTime ? isAfter(startTime, currentTime) : true
            
            return (
              <div 
                key={apt.id} 
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                  isUpcoming ? 'border-l-4 border-l-indigo-500' : 'border-l-4 border-l-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {isHydrated && getStatusIcon(apt.status)}
                      <h4 className="font-semibold text-lg text-gray-900">{apt.subject}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                        apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        apt.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                        apt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {/* Use the global enum translation */}
                        {tEnums(APPOINTMENT_STATUS_MAP[apt.status] || 'status.scheduled')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {format(startTime, 'MMM d, yyyy', { locale: dateLocale })}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {format(startTime, 'p', { locale: dateLocale })} - {format(endTime, 'p', { locale: dateLocale })}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} {t('min')}
                      </div>
                    </div>
                    
                    {apt.notes && (
                      <p className="mt-2 text-sm text-gray-600 italic">{apt.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            {t('pagination.previous')}
          </button>
          <span className="text-sm text-gray-600">
            {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            {t('pagination.next')}
          </button>
        </div>
      )}
    </div>
  )
}