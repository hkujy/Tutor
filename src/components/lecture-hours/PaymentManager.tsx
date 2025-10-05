'use client'

import React, { useState, useEffect } from 'react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { SkeletonList } from '../ui/Skeleton'
import LoadingButton from '../ui/LoadingButton'

interface PaymentReminder {
  id: string
  amount: number
  hoursIncluded: number
  dueDate: string
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  createdAt: string
  paidDate?: string
  paymentMethod?: string
  transactionId?: string
  notes?: string
  lectureHours: {
    subject: string
    student: {
      user: {
        firstName: string
        lastName: string
        email: string
      }
    }
    tutor: {
      user: {
        firstName: string
        lastName: string
      }
    }
  }
  notifications: {
    id: string
    type: string
    message: string
    createdAt: string
    readAt?: string
  }[]
}

interface PaymentManagerProps {
  userRole: 'student' | 'tutor'
  userId: string
}

export default function PaymentManager({ userRole, userId }: PaymentManagerProps) {
  const [payments, setPayments] = useState<PaymentReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>(
    userRole === 'student' ? 'pending' : 'all'
  )
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false)
  const [lectureHours, setLectureHours] = useState<any[]>([]) // For student/subject selection

  useEffect(() => {
    fetchPayments()
  }, [userId, userRole])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/lecture-hours?userId=${userId}&role=${userRole}&payments=true`)
      if (!response.ok) throw new Error('Failed to fetch payments')
      
      const data = await response.json()
      
      // Flatten payments from all lecture hours
      const allPayments: PaymentReminder[] = []
      if (data.lectureHours && Array.isArray(data.lectureHours)) {
        // Store lecture hours for form options
        setLectureHours(data.lectureHours)
        
        data.lectureHours.forEach((lectureHour: any) => {
          if (lectureHour.payments && Array.isArray(lectureHour.payments)) {
            lectureHour.payments.forEach((payment: any) => {
              allPayments.push({
                id: payment.id,
                amount: parseFloat(payment.amount.toString()),
                hoursIncluded: parseFloat(payment.hoursIncluded.toString()),
                dueDate: payment.dueDate,
                status: payment.status,
                createdAt: payment.createdAt,
                paidDate: payment.paidDate,
                paymentMethod: payment.paymentMethod,
                transactionId: payment.transactionId,
                notes: payment.notes,
                lectureHours: {
                  subject: lectureHour.subject,
                  student: lectureHour.student,
                  tutor: lectureHour.tutor
                },
                notifications: [] // TODO: Add notification fetching if needed
              })
            })
          }
        })
      }
      
      setPayments(allPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (paymentId: string) => {
    setProcessingPayment(paymentId)
    try {
      const response = await fetch('/api/lecture-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markPaymentPaid',
          paymentId,
          userId
        })
      })

      if (!response.ok) throw new Error('Failed to mark payment as paid')
      await fetchPayments()
    } catch (error) {
      console.error('Error marking payment as paid:', error)
    } finally {
      setProcessingPayment(null)
    }
  }

  const handleAddPayment = async (paymentData: {
    lectureHoursId: string
    amount: number
    hoursIncluded: number
    paymentMethod: string
    transactionId?: string
    notes?: string
    paidDate: string
  }) => {
    try {
      const response = await fetch('/api/lecture-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPayment',
          ...paymentData,
          userId
        })
      })

      if (!response.ok) throw new Error('Failed to add payment')
      await fetchPayments()
      setShowAddPaymentForm(false)
    } catch (error) {
      console.error('Error adding payment:', error)
      alert('Failed to add payment. Please try again.')
    }
  }

  const getFilteredPayments = () => {
    if (userRole === 'student') {
      // Students only see pending and overdue payments
      return payments.filter(payment => 
        payment.status === 'PENDING' || payment.status === 'OVERDUE'
      )
    }
    
    // Tutors can see all payments based on filter
    switch (filter) {
      case 'pending':
        return payments.filter(payment => payment.status === 'PENDING')
      case 'overdue':
        return payments.filter(payment => payment.status === 'OVERDUE')
      case 'paid':
        return payments.filter(payment => payment.status === 'PAID')
      default:
        return payments
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600 bg-green-100'
      case 'OVERDUE':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getFilterButtons = () => {
    if (userRole === 'student') {
      return [
        { key: 'pending', label: 'Pending', count: payments.filter(p => p.status === 'PENDING').length },
        { key: 'overdue', label: 'Overdue', count: payments.filter(p => p.status === 'OVERDUE').length }
      ]
    }
    
    return [
      { key: 'all', label: 'All', count: payments.length },
      { key: 'pending', label: 'Pending', count: payments.filter(p => p.status === 'PENDING').length },
      { key: 'overdue', label: 'Overdue', count: payments.filter(p => p.status === 'OVERDUE').length },
      { key: 'paid', label: 'Paid', count: payments.filter(p => p.status === 'PAID').length }
    ]
  }

  const getSummaryCards = () => {
    const pendingAmount = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0)
    
    const overdueAmount = payments
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + p.amount, 0)

    if (userRole === 'student') {
      return [
        {
          title: 'Pending Payments',
          amount: pendingAmount,
          count: payments.filter(p => p.status === 'PENDING').length,
          color: 'text-yellow-600'
        },
        {
          title: 'Overdue Payments',
          amount: overdueAmount,
          count: payments.filter(p => p.status === 'OVERDUE').length,
          color: 'text-red-600'
        }
      ]
    }

    const paidAmount = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0)

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

    return [
      {
        title: 'Total Revenue',
        amount: totalAmount,
        count: payments.length,
        color: 'text-blue-600'
      },
      {
        title: 'Pending Payments',
        amount: pendingAmount,
        count: payments.filter(p => p.status === 'PENDING').length,
        color: 'text-yellow-600'
      },
      {
        title: 'Overdue Payments',
        amount: overdueAmount,
        count: payments.filter(p => p.status === 'OVERDUE').length,
        color: 'text-red-600'
      },
      {
        title: 'Paid This Month',
        amount: paidAmount,
        count: payments.filter(p => p.status === 'PAID').length,
        color: 'text-green-600'
      }
    ]
  }

  // Group payments by student for tutor view
  const groupedPayments = userRole === 'tutor' ? 
    getFilteredPayments().reduce((groups, payment) => {
      const studentName = `${payment.lectureHours.student.user.firstName} ${payment.lectureHours.student.user.lastName}`
      if (!groups[studentName]) {
        groups[studentName] = []
      }
      groups[studentName].push(payment)
      return groups
    }, {} as Record<string, PaymentReminder[]>) : null

  const filteredPayments = getFilteredPayments()

  if (loading) {
    return <SkeletonList items={3} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {userRole === 'student' ? 'My Payments' : 'Payment Management'}
        </h2>
        {userRole === 'tutor' && (
          <button
            onClick={() => setShowAddPaymentForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Add Payment
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className={`grid gap-4 ${userRole === 'student' ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {getSummaryCards().map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  ${card.amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">{card.count} payments</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2">
        {getFilterButtons().map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Add Payment Form */}
      {showAddPaymentForm && userRole === 'tutor' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add New Payment</h3>
            <button
              onClick={() => setShowAddPaymentForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <AddPaymentForm
            lectureHours={lectureHours}
            onSubmit={handleAddPayment}
            onCancel={() => setShowAddPaymentForm(false)}
          />
        </div>
      )}

      {/* Payment List */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No payments found</p>
        </div>
      ) : userRole === 'tutor' && groupedPayments ? (
        // Tutor view: Group payments by student
        <div className="space-y-6">
          {Object.entries(groupedPayments).map(([studentName, studentPayments]) => (
            <div key={studentName} className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{studentName}</h3>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600">
                    {studentPayments.length} payment{studentPayments.length !== 1 ? 's' : ''} • 
                    Total: ${studentPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                  </p>
                  <div className="flex space-x-4 text-xs text-gray-500">
                    <span>Paid: ${studentPayments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                    <span>Pending: ${studentPayments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                    <span>Overdue: ${studentPayments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {studentPayments.map((payment) => (
                  <div key={payment.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {payment.lectureHours.subject}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {payment.hoursIncluded} hours • Due {format(new Date(payment.dueDate), 'MMM d, yyyy')}
                                </p>
                                <div className="mt-1 space-y-1">
                                  <p className="text-xs text-gray-400">
                                    Created: {format(new Date(payment.createdAt), 'MMM d, yyyy \u2022 h:mm a')}
                                  </p>
                                  {payment.status === 'PAID' && payment.paidDate && (
                                    <p className="text-xs text-green-600">
                                      Paid: {format(new Date(payment.paidDate), 'MMM d, yyyy \u2022 h:mm a')}
                                      {payment.paymentMethod && ` via ${payment.paymentMethod}`}
                                    </p>
                                  )}
                                  {payment.notes && (
                                    <p className="text-xs text-gray-500">
                                      Note: {payment.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                          <p className="text-lg font-semibold text-gray-900 mt-1">
                            ${payment.amount.toFixed(2)}
                          </p>
                        </div>
                        {payment.status !== 'PAID' && (
                          <LoadingButton
                            onClick={() => handleMarkAsPaid(payment.id)}
                            loading={processingPayment === payment.id}
                            size="sm"
                            variant="secondary"
                          >
                            Mark Paid
                          </LoadingButton>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Student view or tutor ungrouped view: Simple list
        <div className="bg-white rounded-lg shadow-sm border divide-y divide-gray-200">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {payment.lectureHours.subject}
                      </p>
                      <p className="text-sm text-gray-500">
                        {userRole === 'student' 
                          ? `Tutor: ${payment.lectureHours.tutor.user.firstName} ${payment.lectureHours.tutor.user.lastName}`
                          : `Student: ${payment.lectureHours.student.user.firstName} ${payment.lectureHours.student.user.lastName}`
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.hoursIncluded} hours • Due {format(new Date(payment.dueDate), 'MMM d, yyyy')}
                      </p>
                      
                      {/* Payment timing information */}
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-400">
                          Created: {format(new Date(payment.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                        {payment.status === 'PAID' && payment.paidDate && (
                          <p className="text-xs text-green-600">
                            Paid: {format(new Date(payment.paidDate), 'MMM d, yyyy • h:mm a')}
                            {payment.paymentMethod && ` via ${payment.paymentMethod}`}
                            {payment.transactionId && ` (ID: ${payment.transactionId})`}
                          </p>
                        )}
                        {payment.notes && (
                          <p className="text-xs text-gray-500">
                            Note: {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Notifications */}
                  {payment.notifications.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {payment.notifications.slice(0, 2).map((notification) => (
                        <div key={notification.id} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          {notification.message}
                          <span className="ml-2 text-gray-400">
                            {format(new Date(notification.createdAt), 'MMM d')}
                          </span>
                        </div>
                      ))}
                      {payment.notifications.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{payment.notifications.length - 2} more notifications
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                  <p className="text-lg font-semibold text-gray-900">
                    ${payment.amount.toFixed(2)}
                  </p>
                  {payment.status !== 'PAID' && userRole === 'tutor' && (
                    <LoadingButton
                      onClick={() => handleMarkAsPaid(payment.id)}
                      loading={processingPayment === payment.id}
                      size="sm"
                      variant="secondary"
                    >
                      Mark Paid
                    </LoadingButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Add Payment Form Component
interface AddPaymentFormProps {
  lectureHours: any[]
  onSubmit: (data: {
    lectureHoursId: string
    amount: number
    hoursIncluded: number
    paymentMethod: string
    transactionId?: string
    notes?: string
    paidDate: string
  }) => void
  onCancel: () => void
}

function AddPaymentForm({ lectureHours, onSubmit, onCancel }: AddPaymentFormProps) {
  const [formData, setFormData] = useState({
    lectureHoursId: '',
    amount: '',
    hoursIncluded: '',
    paymentMethod: '',
    transactionId: '',
    notes: '',
    paidDate: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.lectureHoursId || !formData.amount || !formData.hoursIncluded || !formData.paymentMethod) {
      alert('Please fill in all required fields')
      return
    }

    onSubmit({
      lectureHoursId: formData.lectureHoursId,
      amount: parseFloat(formData.amount),
      hoursIncluded: parseFloat(formData.hoursIncluded),
      paymentMethod: formData.paymentMethod,
      transactionId: formData.transactionId || undefined,
      notes: formData.notes || undefined,
      paidDate: formData.paidDate
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Student/Subject Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student & Subject *
          </label>
          <select
            value={formData.lectureHoursId}
            onChange={(e) => setFormData(prev => ({ ...prev, lectureHoursId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select student and subject</option>
            {lectureHours.map((lh) => (
              <option key={lh.id} value={lh.id}>
                {lh.student.user.firstName} {lh.student.user.lastName} - {lh.subject}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount ($) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            required
          />
        </div>

        {/* Hours Included */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hours Included *
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={formData.hoursIncluded}
            onChange={(e) => setFormData(prev => ({ ...prev, hoursIncluded: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1.0"
            required
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method *
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select payment method</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="PayPal">PayPal</option>
            <option value="Venmo">Venmo</option>
            <option value="Zelle">Zelle</option>
            <option value="Check">Check</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Date & Time *
          </label>
          <input
            type="datetime-local"
            value={formData.paidDate}
            onChange={(e) => setFormData(prev => ({ ...prev, paidDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Transaction ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction ID (optional)
          </label>
          <input
            type="text"
            value={formData.transactionId}
            onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Reference number, check #, etc."
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Additional notes about this payment..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Payment
        </button>
      </div>
    </form>
  )
}