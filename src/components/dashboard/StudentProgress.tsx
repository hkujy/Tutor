'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { SkeletonCard, Skeleton } from '../ui/skeleton'

interface Subject {
  name: string
  sessionsCompleted: number
  totalSessions: number
  progress: number
  lastSession: string
  nextSession?: string
}

interface StudentProgressProps {
  studentId: string
}

export default function StudentProgress({ studentId }: StudentProgressProps) {
  const t = useTranslations('StudentProgress')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, we initialize as empty to show the empty state for new users
    setSubjects([])
    setLoading(false)
  }, [studentId])

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getProgressTextColor = (progress: number) => {
    if (progress >= 80) return 'text-green-700'
    if (progress >= 60) return 'text-blue-700'
    if (progress >= 40) return 'text-yellow-700'
    return 'text-red-700'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (subjects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="mx-auto h-16 w-16 text-indigo-100 flex items-center justify-center bg-indigo-50 rounded-full mb-4">
          <svg className="h-8 w-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('empty.title')}</h3>
        <p className="text-gray-600 max-w-sm mx-auto">
          {t('empty.description')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('title')}</h3>

      <div className="space-y-6">
        {subjects.map((subject) => (
          <div key={subject.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-gray-900">{subject.name}</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgressTextColor(subject.progress)} bg-opacity-20`}>
                {t('progressComplete', { progress: subject.progress })}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{t('sessionsInfo', { completed: subject.sessionsCompleted, total: subject.totalSessions })}</span>
                <span>{t('remainingSessions', { remaining: subject.totalSessions - subject.sessionsCompleted })}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(subject.progress)}`}
                  style={{ width: `${subject.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Session Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('lastSession')}: {format(new Date(subject.lastSession), 'MMM d, h:mm a')}</span>
              </div>
              {subject.nextSession && (
                <div className="flex items-center text-indigo-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{t('nextSession')}: {format(new Date(subject.nextSession), 'MMM d, h:mm a')}</span>
                </div>
              )}
            </div>

            {/* Expand for details */}
            <button
              onClick={() => setSelectedSubject(selectedSubject === subject.name ? null : subject.name)}
              className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              {selectedSubject === subject.name ? t('actions.hideDetails') : t('actions.viewDetails')}
            </button>

            {selectedSubject === subject.name && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">{t('details.recentActivities')}</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('details.activity1')}</span>
                    <span className="text-gray-500">Sep 28</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('details.activity2')}</span>
                    <span className="text-gray-500">Sep 25</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('details.activity3')}</span>
                    <span className="text-gray-500">Sep 22</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h6 className="font-medium text-gray-900 mb-2">{t('details.upcomingGoals')}</h6>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• {t('details.goal1')}</li>
                    <li>• {t('details.goal2')}</li>
                    <li>• {t('details.goal3')}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Performance Summary */}
      <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
        <h4 className="font-medium text-indigo-900 mb-2">{t('overall.title')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {Math.round(subjects.reduce((acc, sub) => acc + sub.progress, 0) / subjects.length)}%
            </div>
            <div className="text-indigo-700">{t('overall.averageProgress')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {subjects.reduce((acc, sub) => acc + sub.sessionsCompleted, 0)}
            </div>
            <div className="text-indigo-700">{t('overall.totalSessions')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">0.0</div>
            <div className="text-indigo-700">{t('overall.averageRating')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
