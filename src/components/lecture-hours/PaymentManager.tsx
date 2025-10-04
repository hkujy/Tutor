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
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('pending')
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [userId])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/lecture-hours?userId=${userId}&role=${userRole}&payments=true`)
      if (res.ok) {
        const data = await res.json()
        // Extract payments from lecture hours data
        const allPayments = data.lectureHours?.flatMap((lh: any) => 
          lh.payments.map((payment: any) => ({
            ...payment,
            lectureHours: {
              subject: lh.subject,
              student: lh.student,
              tutor: lh.tutor
            },
            notifications: [] // We'll fetch these separately if needed
          }))
        ) || []
        
        // Fetch notifications for each payment if there are any
        for (const payment of allPayments) {
          try {
            const notifRes = await fetch(`/api/notifications?userId=${userId}&type=PAYMENT_REMINDER&limit=5`)
            if (notifRes.ok) {
              const notifData = await notifRes.json()
              payment.notifications = notifData.notifications || []
            }
          } catch (error) {
            console.error('Failed to fetch notifications for payment:', error)
          }
        }
        
        setPayments(allPayments)
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const markPaymentAsPaid = async (paymentId: string) => {
    setProcessingPayment(paymentId)
    try {
      const res = await fetch('/api/lecture-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          status: 'PAID',
          paidDate: new Date().toISOString()
        })
      })

      if (res.ok) {
        fetchPayments() // Refresh data
      }
    } catch (error) {
      console.error('Failed to update payment:', error)
    } finally {
      setProcessingPayment(null)
    }
  }

  const sendPaymentReminder = async (paymentId: string) => {
    try {
      const res = await fetch('/api/lecture-hours/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      })

      if (res.ok) {
        fetchPayments() // Refresh to show new notification
      }
    } catch (error) {
      console.error('Failed to send reminder:', error)
    }
  }

  const getFilteredPayments = () => {
    const now = new Date()
    
    switch (filter) {
      case 'pending':
        return payments.filter(p => p.status === 'PENDING')
      case 'overdue':
        return payments.filter(p => p.status === 'OVERDUE' || (p.status === 'PENDING' && isBefore(new Date(p.dueDate), now)))
      case 'paid':
        return payments.filter(p => p.status === 'PAID')
      default:
        return payments
    }
  }

  const getPaymentStatusColor = (status: string, dueDate: string) => {
    const now = new Date()
    if (status === 'PAID') return 'bg-green-100 text-green-800'
    if (status === 'OVERDUE' || (status === 'PENDING' && isBefore(new Date(dueDate), now))) {
      return 'bg-red-100 text-red-800'
    }
    return 'bg-yellow-100 text-yellow-800'
  }

  const getUrgencyIndicator = (dueDate: string, status: string) => {
    if (status === 'PAID') return null
    
    const now = new Date()
    const due = new Date(dueDate)
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) {
      return <span className="text-red-600 font-semibold">Overdue by {Math.abs(daysUntilDue)} days</span>
    } else if (daysUntilDue <= 3) {
      return <span className="text-orange-600 font-semibold">Due in {daysUntilDue} days</span>
    } else if (daysUntilDue <= 7) {
      return <span className="text-yellow-600">Due in {daysUntilDue} days</span>
    }
    return null
  }

  const filteredPayments = getFilteredPayments()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <SkeletonList items={4} showAvatar={false} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {userRole === 'student' ? 'My Payments' : 'Payment Collection'}
            </h2>
            <p className="text-gray-600 mt-1">
              {userRole === 'student' 
                ? 'Track and manage your lesson payments'
                : 'Monitor student payments and send reminders'
              }
            </p>
          </div>
          
          {/* Filter Options */}
          <div className="flex gap-2">
            {['all', 'pending', 'overdue', 'paid'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as any)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  filter === filterOption
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  {userRole === 'student' ? 'Pending Payments' : 'Awaiting Payment'}
                </p>
                <p className="text-lg font-bold text-yellow-900">
                  {payments.filter(p => p.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {userRole === 'student' ? 'Overdue' : 'Overdue Payments'}
                </p>
                <p className="text-lg font-bold text-red-900">
                  {payments.filter(p => p.status === 'OVERDUE' || (p.status === 'PENDING' && isBefore(new Date(p.dueDate), new Date()))).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {userRole === 'student' ? 'Completed Payments' : 'Payments Received'}
                </p>
                <p className="text-lg font-bold text-green-900">
                  {payments.filter(p => p.status === 'PAID').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  {userRole === 'student' ? 'Total Amount' : 'Total Expected'}
                </p>
                <p className="text-lg font-bold text-blue-900">
                  ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {filter.charAt(0).toUpperCase() + filter.slice(1)} Payments ({filteredPayments.length})
          </h3>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'pending' 
                ? userRole === 'student' 
                  ? 'No pending payments at this time.' 
                  : 'No students have pending payments.'
                : filter === 'overdue' 
                  ? userRole === 'student'
                    ? 'No overdue payments found.'
                    : 'No overdue payments from students.'
                  : filter === 'paid' 
                    ? userRole === 'student'
                      ? 'No completed payments in the system.'
                      : 'No payments received yet.'
                    : 'No payments found.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        ${payment.amount.toFixed(2)}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status, payment.dueDate)}`}>
                        {payment.status}
                      </span>
                      {userRole === 'tutor' && payment.status !== 'PAID' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Awaiting from student
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Subject: <span className="font-medium">{payment.lectureHours.subject}</span></p>
                        <p className="text-sm text-gray-600">
                          {userRole === 'student' 
                            ? `Tutor: ${payment.lectureHours.tutor.user.firstName} ${payment.lectureHours.tutor.user.lastName}`
                            : `Student: ${payment.lectureHours.student.user.firstName} ${payment.lectureHours.student.user.lastName}`
                          }
                        </p>
                        <p className="text-sm text-gray-600">Hours: <span className="font-medium">{payment.hoursIncluded}h</span></p>
                        {userRole === 'tutor' && (
                          <p className="text-sm text-gray-600">Student Email: <span className="font-medium">{payment.lectureHours.student.user.email}</span></p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Due Date: <span className="font-medium">{format(new Date(payment.dueDate), 'MMM d, yyyy')}</span></p>
                        {getUrgencyIndicator(payment.dueDate, payment.status) && (
                          <div className="mt-1">
                            {getUrgencyIndicator(payment.dueDate, payment.status)}
                          </div>
                        )}
                        {userRole === 'tutor' && payment.status === 'PAID' && (
                          <p className="text-sm text-green-600 font-medium">✓ Payment received</p>
                        )}
                      </div>
                    </div>

                    {/* Recent Notifications */}
                    {payment.notifications.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {userRole === 'student' ? 'Payment Reminders:' : 'Reminders Sent:'}
                        </p>
                        <div className="space-y-1">
                          {payment.notifications.slice(0, 2).map((notification) => (
                            <div key={notification.id} className="flex items-start gap-2">
                              <div className={`w-2 h-2 rounded-full mt-1.5 ${notification.readAt ? 'bg-gray-300' : 'bg-blue-500'}`} />
                              <div className="flex-1">
                                <p className="text-xs text-gray-600">{notification.message}</p>
                                <p className="text-xs text-gray-400">{format(new Date(notification.createdAt), 'MMM d, h:mm a')}</p>
                              </div>
                            </div>
                          ))}
                          {payment.notifications.length > 2 && (
                            <p className="text-xs text-gray-500 mt-1">+{payment.notifications.length - 2} more notifications</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-6">
                    {payment.status === 'PENDING' && userRole === 'student' && (
                      <LoadingButton
                        onClick={() => markPaymentAsPaid(payment.id)}
                        loading={processingPayment === payment.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        Mark as Paid
                      </LoadingButton>
                    )}
                    
                    {payment.status !== 'PAID' && userRole === 'tutor' && (
                      <button
                        onClick={() => sendPaymentReminder(payment.id)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                      >
                        Send Reminder
                      </button>
                    )}

                    {userRole === 'student' && payment.status !== 'PAID' && (
                      <a
                        href={`mailto:${payment.lectureHours.tutor.user.firstName.toLowerCase()}@example.com?subject=Payment for ${payment.lectureHours.subject} lessons&body=Hi ${payment.lectureHours.tutor.user.firstName}, I would like to discuss the payment of $${payment.amount.toFixed(2)} for ${payment.hoursIncluded} hours of ${payment.lectureHours.subject} lessons.`}
                        className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 text-center"
                      >
                        Contact Tutor
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}