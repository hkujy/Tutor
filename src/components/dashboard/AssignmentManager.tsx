'use client'

import React, { useState, useEffect } from 'react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { useTranslations } from 'next-intl'
import { SkeletonList, Skeleton } from '../ui/Skeleton'
import LoadingButton from '../ui/LoadingButton'
import { ASSIGNMENT_STATUS_MAP, DIFFICULTY_LEVEL_MAP } from '../../constants'

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'overdue'
  subject: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  attachments?: string[]
  grade?: number
  feedback?: string
  submittedDate?: string
}

interface AssignmentManagerProps {
  userRole: 'student' | 'tutor'
  userId: string
}

export default function AssignmentManager({ userRole, userId }: AssignmentManagerProps) {
  const t = useTranslations('AssignmentManager')
  const tEnums = useTranslations('Enums')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)

  useEffect(() => {
    // Mock data - in a real app this would come from an API
    const mockAssignments: Assignment[] = [
      {
        id: '1',
        title: 'Quadratic Equations Practice',
        description: 'Complete the worksheet on solving quadratic equations using the quadratic formula.',
        dueDate: '2025-10-05T23:59:00Z',
        status: 'assigned',
        subject: 'Mathematics',
        difficulty: 'intermediate',
        attachments: ['quadratic_worksheet.pdf']
      },
      {
        id: '2',
        title: 'Physics Lab Report',
        description: 'Write a lab report on the pendulum experiment we conducted last week.',
        dueDate: '2025-10-08T23:59:00Z',
        status: 'in_progress',
        subject: 'Physics',
        difficulty: 'advanced',
        attachments: ['lab_template.docx', 'data_sheet.xlsx']
      },
      {
        id: '3',
        title: 'Chemical Bonding Quiz',
        description: 'Take the online quiz on ionic and covalent bonding.',
        dueDate: '2025-09-28T23:59:00Z',
        status: 'graded',
        subject: 'Chemistry',
        difficulty: 'beginner',
        grade: 92,
        feedback: 'Excellent work! You clearly understand the concepts.',
        submittedDate: '2025-09-27T14:30:00Z'
      },
      {
        id: '4',
        title: 'Essay on Photosynthesis',
        description: 'Write a 500-word essay explaining the process of photosynthesis.',
        dueDate: '2025-09-30T23:59:00Z',
        status: 'overdue',
        subject: 'Biology',
        difficulty: 'intermediate'
      }
    ]

    setTimeout(() => {
      setAssignments(mockAssignments)
      setLoading(false)
    }, 1000)
  }, [userId])

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'submitted': return 'bg-purple-100 text-purple-800'
      case 'graded': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
    }
  }

  const getDifficultyColor = (difficulty: Assignment['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
    }
  }

  const getFilteredAssignments = () => {
    switch (filter) {
      case 'pending':
        return assignments.filter(a => ['assigned', 'in_progress'].includes(a.status))
      case 'completed':
        return assignments.filter(a => ['submitted', 'graded'].includes(a.status))
      case 'overdue':
        return assignments.filter(a => a.status === 'overdue')
      default:
        return assignments
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredAssignments = getFilteredAssignments()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton width={200} height={24} className="bg-gray-300" />
          <Skeleton width={120} height={36} />
        </div>
        <div className="flex gap-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} width={80} height={32} />
          ))}
        </div>
        <SkeletonList items={5} showAvatar={false} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {userRole === 'tutor' ? t('tutorTitle') : t('studentTitle')}
        </h3>
        <div className="flex items-center gap-3">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{t('filters.all')}</option>
            <option value="pending">{t('filters.pending')}</option>
            <option value="completed">{t('filters.completed')}</option>
            <option value="overdue">{t('filters.overdue')}</option>
          </select>
          {userRole === 'tutor' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              {t('actions.create')}
            </button>
          )}
        </div>
      </div>

      {/* Assignment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {assignments.filter(a => ['assigned', 'in_progress'].includes(a.status)).length}
          </div>
          <div className="text-sm text-blue-700">{t('stats.pending')}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {assignments.filter(a => a.status === 'graded').length}
          </div>
          <div className="text-sm text-green-700">{t('stats.completed')}</div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {assignments.filter(a => a.status === 'overdue').length}
          </div>
          <div className="text-sm text-red-700">{t('stats.overdue')}</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {assignments.filter(a => a.grade).reduce((acc, a) => acc + (a.grade || 0), 0) / 
             assignments.filter(a => a.grade).length || 0}%
          </div>
          <div className="text-sm text-purple-700">{t('stats.avgGrade')}</div>
        </div>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('empty.title')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? t('empty.all') : t('empty.filter', { filter: t(`filters.${filter}`) })}
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const daysUntilDue = getDaysUntilDue(assignment.dueDate)
            
            return (
              <div 
                key={assignment.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedAssignment(assignment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(assignment.status)}`}>
                        {tEnums(ASSIGNMENT_STATUS_MAP[assignment.status.toUpperCase()])}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(assignment.difficulty)}`}>
                        {tEnums(DIFFICULTY_LEVEL_MAP[assignment.difficulty.toUpperCase()])}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{assignment.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {assignment.subject}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {t('labels.dueDate')}: {format(new Date(assignment.dueDate), 'MMM d, yyyy')}
                      </span>

                      {assignment.status !== 'overdue' && daysUntilDue >= 0 && (
                        <span className={`flex items-center gap-1 ${
                          daysUntilDue <= 1 ? 'text-red-600' : daysUntilDue <= 3 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {daysUntilDue === 0 ? t('labels.dueToday') : t('labels.daysLeft', { count: daysUntilDue })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {assignment.grade && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{assignment.grade}%</div>
                        <div className="text-xs text-gray-500">{t('labels.grade')}</div>
                      </div>
                    )}
                    
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Assignment Detail Modal would go here */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedAssignment.title}</h3>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">{selectedAssignment.description}</p>
                
                {selectedAssignment.attachments && (
                  <div>
                    <h4 className="font-medium mb-2">{t('modal.attachments')}</h4>
                    <div className="space-y-2">
                      {selectedAssignment.attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="text-sm">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAssignment.feedback && (
                  <div>
                    <h4 className="font-medium mb-2">{t('modal.feedback')}</h4>
                    <p className="text-gray-600 bg-green-50 p-3 rounded">{selectedAssignment.feedback}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  {userRole === 'student' && ['assigned', 'in_progress'].includes(selectedAssignment.status) && (
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                      {t('modal.submitAssignment')}
                    </button>
                  )}
                  {userRole === 'tutor' && selectedAssignment.status === 'submitted' && (
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                      {t('modal.gradeAssignment')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
