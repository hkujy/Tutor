'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'

interface AddHoursModalProps {
  studentId: string
  studentName: string
  isOpen: boolean
  onClose: () => void
  onSave: (hoursData: {
    studentId: string
    hours: number
    date: string
    subject: string
    description: string
    hourlyRate: number
  }) => Promise<void>
  tutorId: string
}

export default function AddHoursModal({ 
  studentId,
  studentName,
  isOpen, 
  onClose, 
  onSave,
  tutorId 
}: AddHoursModalProps) {
  const [formData, setFormData] = useState({
    hours: 1,
    date: format(new Date(), 'yyyy-MM-dd'),
    subject: '',
    description: '',
    hourlyRate: 50
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError('')

    try {
      await onSave({
        studentId,
        ...formData
      })
      onClose()
      // Reset form
      setFormData({
        hours: 1,
        date: format(new Date(), 'yyyy-MM-dd'),
        subject: '',
        description: '',
        hourlyRate: 50
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add hours')
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

  if (!isOpen) return null

  const totalAmount = formData.hours * formData.hourlyRate

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add Lecture Hours</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              Adding hours for: <strong>{studentName}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  value={formData.hours}
                  onChange={(e) => handleInputChange('hours', parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="e.g., Mathematics, Physics, Chemistry"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 50)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Notes
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Session notes, topics covered, homework assigned..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Calculation Summary */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between text-sm">
                <span>Hours: {formData.hours}</span>
                <span>Rate: ${formData.hourlyRate}</span>
              </div>
              <div className="border-t mt-2 pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
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
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Hours'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}