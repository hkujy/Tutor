'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import StudentEditModal from './StudentEditModal'
import AddHoursModal from './AddHoursModal'

interface StudentSummary {
  studentId: string
  studentName: string
  email: string
  totalHours: number
  unpaidHours: number
  totalEarnings: number
  unpaidEarnings: number
  lastSession?: string
  paymentStatus: 'up-to-date' | 'payment-due' | 'overdue'
  paymentInterval: number
}

interface StudentSummaryListProps {
  tutorId: string
}

export default function StudentSummaryList({ tutorId }: StudentSummaryListProps) {
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingStudent, setEditingStudent] = useState<StudentSummary | null>(null)
  const [addingHoursForStudent, setAddingHoursForStudent] = useState<StudentSummary | null>(null)

  useEffect(() => {
    fetchStudentSummaries()
  }, [tutorId])

  const fetchStudentSummaries = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tutors/${tutorId}/student-summary`)
      const data = await response.json()
      
      if (response.ok) {
        setStudents(data.students || [])
      } else {
        setError(data.error || 'Failed to fetch student summaries')
      }
    } catch (err) {
      setError('Failed to fetch student summaries')
      console.error('Error fetching student summaries:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditStudent = async (updatedStudent: Partial<StudentSummary>) => {
    try {
      // We need to get the tutor ID first, since the API expects the actual tutor ID, not user ID
      const tutorResponse = await fetch(`/api/tutors/by-user/${tutorId}`)
      const tutorData = await tutorResponse.json()
      
      if (!tutorResponse.ok) {
        throw new Error(tutorData.error || 'Failed to find tutor')
      }

      const response = await fetch(`/api/tutors/${tutorData.tutorId}/students/${updatedStudent.studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStudent),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update student')
      }

      // Refresh the student list
      await fetchStudentSummaries()
      setEditingStudent(null)
    } catch (err) {
      throw err // Re-throw to be handled by the modal
    }
  }

  const handleAddHours = async (hoursData: any) => {
    try {
      // We need to get the tutor ID first
      const tutorResponse = await fetch(`/api/tutors/by-user/${tutorId}`)
      const tutorData = await tutorResponse.json()
      
      if (!tutorResponse.ok) {
        throw new Error(tutorData.error || 'Failed to find tutor')
      }

      const response = await fetch(`/api/tutors/${tutorData.tutorId}/lecture-hours`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hoursData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add hours')
      }

      // Refresh the student list
      await fetchStudentSummaries()
      setAddingHoursForStudent(null)
    } catch (err) {
      throw err // Re-throw to be handled by the modal
    }
  }

  const handleMarkPaymentReceived = async (studentId: string) => {
    if (!confirm('Mark all unpaid hours as paid? This action cannot be undone.')) {
      return
    }

    try {
      // We need to get the tutor ID first
      const tutorResponse = await fetch(`/api/tutors/by-user/${tutorId}`)
      const tutorData = await tutorResponse.json()
      
      if (!tutorResponse.ok) {
        throw new Error(tutorData.error || 'Failed to find tutor')
      }

      const response = await fetch(`/api/tutors/${tutorData.tutorId}/students/${studentId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Payment received - marked by tutor' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to mark payment as received')
      }

      // Refresh the student list
      await fetchStudentSummaries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark payment as received')
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'up-to-date': return 'text-green-600 bg-green-50'
      case 'payment-due': return 'text-yellow-600 bg-yellow-50'
      case 'overdue': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'up-to-date': return 'Up to Date'
      case 'payment-due': return 'Payment Due'
      case 'overdue': return 'Overdue'
      default: return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Student Summary</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Student Summary</h2>
        <div className="text-red-600 text-center py-4">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Student Summary</h2>
      
      {students.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No students found
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <div key={student.studentId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{student.studentName}</h3>
                  <p className="text-gray-600 text-sm">{student.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(student.paymentStatus)}`}>
                    {getPaymentStatusText(student.paymentStatus)}
                  </span>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditingStudent(student)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit student data"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => setAddingHoursForStudent(student)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Add lecture hours"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    
                    {student.unpaidEarnings > 0 && (
                      <button
                        onClick={() => handleMarkPaymentReceived(student.studentId)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Mark payment received"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Hours:</span>
                  <div className="font-semibold">{student.totalHours.toFixed(1)}h</div>
                </div>
                
                <div>
                  <span className="text-gray-500">Unpaid Hours:</span>
                  <div className={`font-semibold ${student.unpaidHours > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {student.unpaidHours.toFixed(1)}h
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Total Earnings:</span>
                  <div className="font-semibold">${student.totalEarnings.toFixed(2)}</div>
                </div>
                
                <div>
                  <span className="text-gray-500">Unpaid Earnings:</span>
                  <div className={`font-semibold ${student.unpaidEarnings > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${student.unpaidEarnings.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {student.lastSession && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-gray-500 text-sm">Last Session: </span>
                  <span className="text-sm">{format(new Date(student.lastSession), 'MMM d, yyyy')}</span>
                </div>
              )}
              
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress to next payment</span>
                  <span>{(student.unpaidHours % student.paymentInterval).toFixed(1)}/{student.paymentInterval}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (student.unpaidHours % student.paymentInterval) / student.paymentInterval * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Student Modal */}
      <StudentEditModal
        student={editingStudent}
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSave={handleEditStudent}
        tutorId={tutorId}
      />

      {/* Add Hours Modal */}
      <AddHoursModal
        studentId={addingHoursForStudent?.studentId || ''}
        studentName={addingHoursForStudent?.studentName || ''}
        isOpen={!!addingHoursForStudent}
        onClose={() => setAddingHoursForStudent(null)}
        onSave={handleAddHours}
        tutorId={tutorId}
      />
    </div>
  )
}