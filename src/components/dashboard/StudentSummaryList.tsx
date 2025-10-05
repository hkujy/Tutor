'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'

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
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(student.paymentStatus)}`}>
                  {getPaymentStatusText(student.paymentStatus)}
                </span>
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
    </div>
  )
}