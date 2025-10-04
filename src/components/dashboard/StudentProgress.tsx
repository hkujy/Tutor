'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { SkeletonCard, Skeleton } from '../ui/Skeleton'

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
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  useEffect(() => {
    // Mock data - in a real app this would come from an API
    const mockSubjects: Subject[] = [
      {
        name: 'Mathematics',
        sessionsCompleted: 8,
        totalSessions: 12,
        progress: 67,
        lastSession: '2025-09-28T10:00:00Z',
        nextSession: '2025-10-05T10:00:00Z'
      },
      {
        name: 'Physics',
        sessionsCompleted: 5,
        totalSessions: 8,
        progress: 63,
        lastSession: '2025-09-25T14:00:00Z',
        nextSession: '2025-10-02T14:00:00Z'
      },
      {
        name: 'Chemistry',
        sessionsCompleted: 3,
        totalSessions: 6,
        progress: 50,
        lastSession: '2025-09-20T16:00:00Z',
        nextSession: '2025-10-03T16:00:00Z'
      }
    ]
    
    setTimeout(() => {
      setSubjects(mockSubjects)
      setLoading(false)
    }, 1000)
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
        <Skeleton width={180} height={24} className="bg-gray-300 mb-6" />
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} lines={4} className="border" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Learning Progress</h3>
      
      <div className="space-y-6">
        {subjects.map((subject, index) => (
          <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-gray-900">{subject.name}</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgressTextColor(subject.progress)} bg-opacity-20`}>
                {subject.progress}% Complete
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{subject.sessionsCompleted} of {subject.totalSessions} sessions</span>
                <span>{subject.totalSessions - subject.sessionsCompleted} remaining</span>
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
                <span>Last: {format(new Date(subject.lastSession), 'MMM d, h:mm a')}</span>
              </div>
              {subject.nextSession && (
                <div className="flex items-center text-indigo-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Next: {format(new Date(subject.nextSession), 'MMM d, h:mm a')}</span>
                </div>
              )}
            </div>

            {/* Expand for details */}
            <button 
              onClick={() => setSelectedSubject(selectedSubject === subject.name ? null : subject.name)}
              className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              {selectedSubject === subject.name ? 'Hide details' : 'View details'}
            </button>

            {selectedSubject === subject.name && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Recent Activities</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>✅ Completed quadratic equations worksheet</span>
                    <span className="text-gray-500">Sep 28</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>📝 Homework: Chapter 5 problems 1-15</span>
                    <span className="text-gray-500">Sep 25</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>⭐ Achieved 90% on practice test</span>
                    <span className="text-gray-500">Sep 22</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h6 className="font-medium text-gray-900 mb-2">Upcoming Goals</h6>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Master polynomial factoring</li>
                    <li>• Complete practice exam</li>
                    <li>• Review trigonometric functions</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Performance Summary */}
      <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
        <h4 className="font-medium text-indigo-900 mb-2">Overall Performance</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {Math.round(subjects.reduce((acc, sub) => acc + sub.progress, 0) / subjects.length)}%
            </div>
            <div className="text-indigo-700">Average Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {subjects.reduce((acc, sub) => acc + sub.sessionsCompleted, 0)}
            </div>
            <div className="text-indigo-700">Total Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">4.9</div>
            <div className="text-indigo-700">Average Rating</div>
          </div>
        </div>
      </div>
    </div>
  )
}