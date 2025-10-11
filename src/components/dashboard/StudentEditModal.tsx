'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface StudentData {
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

interface StudentEditModalProps {
  student: StudentData | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedStudent: Partial<StudentData>) => Promise<void>
  tutorId: string
}

export default function StudentEditModal({ 
  student, 
  isOpen, 
  onClose, 
  onSave,
  tutorId 
}: StudentEditModalProps) {
  const [formData, setFormData] = useState<{
    studentName: string
    email: string
    unpaidHours: number
    unpaidEarnings: number
    paymentStatus: 'up-to-date' | 'payment-due' | 'overdue'
    paymentInterval: number
    adjustmentReason: string
  }>({
    studentName: '',
    email: '',
    unpaidHours: 0,
    unpaidEarnings: 0,
    paymentStatus: 'up-to-date',
    paymentInterval: 10,
    adjustmentReason: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (student) {
      setFormData({
        studentName: student.studentName,
        email: student.email,
        unpaidHours: student.unpaidHours,
        unpaidEarnings: student.unpaidEarnings,
        paymentStatus: student.paymentStatus,
        paymentInterval: student.paymentInterval,
        adjustmentReason: ''
      })
    }
  }, [student])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return

    setLoading(true)
    setError('')

    try {
      await onSave({
        ...formData,
        studentId: student.studentId
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen || !student) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Edit Student Data</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name
              </label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Payment Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unpaid Hours
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.unpaidHours}
                  onChange={(e) => handleInputChange('unpaidHours', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unpaid Earnings ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unpaidEarnings}
                  onChange={(e) => handleInputChange('unpaidEarnings', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="up-to-date">Up to Date</option>
                <option value="payment-due">Payment Due</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Interval (hours)
              </label>
              <input
                type="number"
                value={formData.paymentInterval}
                onChange={(e) => handleInputChange('paymentInterval', parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="100"
              />
            </div>

            {/* Adjustment Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Changes
              </label>
              <textarea
                value={formData.adjustmentReason}
                onChange={(e) => handleInputChange('adjustmentReason', e.target.value)}
                placeholder="Enter reason for making these changes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            {/* Summary of Changes */}
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Changes Summary:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                {formData.studentName !== student.studentName && (
                  <div>Name: {student.studentName} → {formData.studentName}</div>
                )}
                {formData.email !== student.email && (
                  <div>Email: {student.email} → {formData.email}</div>
                )}
                {formData.unpaidHours !== student.unpaidHours && (
                  <div>Unpaid Hours: {student.unpaidHours}h → {formData.unpaidHours}h</div>
                )}
                {formData.unpaidEarnings !== student.unpaidEarnings && (
                  <div>Unpaid Earnings: ${student.unpaidEarnings} → ${formData.unpaidEarnings}</div>
                )}
                {formData.paymentStatus !== student.paymentStatus && (
                  <div>Payment Status: {student.paymentStatus} → {formData.paymentStatus}</div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}