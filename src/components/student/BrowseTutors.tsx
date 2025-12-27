'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { formatCurrency } from '@/lib/utils'
import { useTranslations } from 'next-intl'

type Tutor = {
    id: string
    user: {
        firstName: string
        lastName: string
        email: string
    }
    subjects: string[]
    hourlyRate: number
    availability: Array<{
        dayOfWeek: number
        startTime: string
        endTime: string
    }>
    availableSlots: number
    tutorProfile?: {
        currency: string
    }
}

export default function BrowseTutors() {
    const t = useTranslations('BrowseTutors')
    const [tutors, setTutors] = useState<Tutor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [subjectFilter, setSubjectFilter] = useState('')
    const router = useRouter()

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    useEffect(() => {
        fetchTutors()
    }, [])

    const fetchTutors = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/tutors')

            if (!response.ok) {
                throw new Error('Failed to fetch tutors')
            }

            const data = await response.json()
            setTutors(data.tutors || [])
            setError(null)
        } catch (err: any) {
            console.error('Error fetching tutors:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredTutors = subjectFilter
        ? tutors.filter(tutor =>
            tutor.subjects.some(subject =>
                subject.toLowerCase().includes(subjectFilter.toLowerCase())
            )
        )
        : tutors

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error: {error}</p>
                <button
                    onClick={fetchTutors}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                    Try again
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                    {t('title', { count: filteredTutors.length })}
                </h2>
                <div>
                    <input
                        type="text"
                        placeholder={t('filterPlaceholder')}
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Tutor Grid */}
            {filteredTutors.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">
                        {subjectFilter
                            ? t('noTutorsFiltered', { subject: subjectFilter })
                            : t('noTutors')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTutors.map((tutor) => (
                        <div
                            key={tutor.id}
                            data-testid="tutor-card"
                            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200"
                        >
                            {/* Tutor Info */}
                            <div className="mb-4">
                                <h3 data-testid="tutor-name" className="text-lg font-semibold text-foreground">
                                    {tutor.user.firstName} {tutor.user.lastName}
                                </h3>
                                <p className="text-sm text-muted-foreground">{tutor.user.email}</p>
                            </div>

                            {/* Subjects */}
                            <div className="mb-4">
                                <p className="text-xs font-medium text-muted-foreground mb-2">{t('subjectsLabel')}:</p>
                                <div className="flex flex-wrap gap-2">
                                    {tutor.subjects.map((subject, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                                        >
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Rate */}
                            <div className="mb-4">
                                <p data-testid="tutor-rate" className="text-2xl font-bold text-foreground">
                                    {formatCurrency(tutor.hourlyRate || 0, tutor.tutorProfile?.currency || 'USD')}
                                    <span className="text-sm text-muted-foreground font-normal">/hour</span>
                                </p>
                            </div>

                            {/* Availability Summary */}
                            <div className="mb-4">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                    {t('availableSlots', { count: tutor.availableSlots })}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {tutor.availability.slice(0, 3).map((slot, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded"
                                        >
                                            {DAYS[slot.dayOfWeek]} {slot.startTime}
                                        </span>
                                    ))}
                                    {tutor.availability.length > 3 && (
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                            +{tutor.availability.length - 3} {t('more')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                data-testid="book-button"
                                onClick={() => router.push(`/student?tutorId=${tutor.id}${subjectFilter ? `&subject=${subjectFilter}` : ''}`)}
                                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                            >
                                {t('bookButton')}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
