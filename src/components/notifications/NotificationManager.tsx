'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { notificationService, type Notification, type NotificationsResponse } from '../../lib/services/notification.service'
import { Skeleton } from '../ui/Skeleton'
import LoadingButton from '../ui/LoadingButton'

interface NotificationManagerProps {
  userId: string
  userRole: 'student' | 'tutor'
}

export default function NotificationManager({ userId, userRole }: NotificationManagerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [activeFilter, currentPage])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 20
      }

      if (activeFilter === 'unread') {
        params.unread = true
      } else if (activeFilter !== 'all') {
        params.type = activeFilter
      }

      const response: NotificationsResponse = await notificationService.getNotifications(params)
      setNotifications(response.notifications)
      setUnreadCount(response.unreadCount)
      setTotalPages(response.pagination.pages)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, readAt: new Date().toISOString() }
            : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleBulkMarkAsRead = async () => {
    try {
      setBulkActionLoading(true)
      
      if (selectedNotifications.size > 0) {
        const notificationIds = Array.from(selectedNotifications)
        await notificationService.bulkMarkAsRead(notificationIds)
        
        setNotifications(prev => 
          prev.map(n => 
            selectedNotifications.has(n.id) 
              ? { ...n, readAt: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - selectedNotifications.size))
        setSelectedNotifications(new Set())
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setBulkActionLoading(true)
      await notificationService.bulkMarkAsRead(undefined, true)
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const unreadIds = notifications.filter(n => !n.readAt).map(n => n.id)
    setSelectedNotifications(new Set(unreadIds))
  }

  const handleClearSelection = () => {
    setSelectedNotifications(new Set())
  }

  const getFilterOptions = () => {
    const options = [
      { key: 'all', label: 'All Notifications', count: notifications.length },
      { key: 'unread', label: 'Unread', count: unreadCount },
      { key: 'APPOINTMENT_REMINDER', label: 'Appointment Reminders', icon: '📅' },
      { key: 'ASSIGNMENT_DUE', label: 'Assignment Due', icon: '📚' },
      { key: 'PAYMENT_REMINDER', label: 'Payment Reminders', icon: '💰' },
      { key: 'SYSTEM_ANNOUNCEMENT', label: 'System Announcements', icon: '📢' }
    ]

    // Add role-specific filters
    if (userRole === 'tutor') {
      options.push({ key: 'PAYMENT_RECEIVED', label: 'Payment Received', icon: '💸' })
    }

    return options
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <Skeleton width={200} height={24} className="mb-4" />
          <div className="flex space-x-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} width={100} height={32} />
            ))}
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton width={40} height={40} variant="circular" />
              <div className="flex-1">
                <Skeleton width="60%" height={20} className="mb-2" />
                <Skeleton width="80%" height={16} className="mb-1" />
                <Skeleton width="40%" height={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          
          {/* Bulk Actions */}
          <div className="flex items-center space-x-2">
            {selectedNotifications.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedNotifications.size} selected
                </span>
                <LoadingButton
                  onClick={handleBulkMarkAsRead}
                  loading={bulkActionLoading}
                  variant="secondary"
                  size="sm"
                >
                  Mark Selected as Read
                </LoadingButton>
                <button
                  onClick={handleClearSelection}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </>
            )}
            
            {unreadCount > 0 && (
              <LoadingButton
                onClick={handleMarkAllAsRead}
                loading={bulkActionLoading}
                variant="secondary"
                size="sm"
              >
                Mark All as Read
              </LoadingButton>
            )}
            
            {selectedNotifications.size === 0 && unreadCount > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Select All Unread
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 overflow-x-auto">
          {getFilterOptions().map((option) => (
            <button
              key={option.key}
              onClick={() => {
                setActiveFilter(option.key)
                setCurrentPage(1)
                setSelectedNotifications(new Set())
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                activeFilter === option.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {option.icon && <span>{option.icon}</span>}
              <span>{option.label}</span>
              {option.count !== undefined && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                  activeFilter === option.key
                    ? 'bg-indigo-200 text-indigo-800'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {activeFilter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."
              }
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              isSelected={selectedNotifications.has(notification.id)}
              onSelect={() => handleSelectNotification(notification.id)}
              onMarkAsRead={() => handleMarkAsRead(notification.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual Notification Item Component
interface NotificationItemProps {
  notification: Notification
  isSelected: boolean
  onSelect: () => void
  onMarkAsRead: () => void
}

function NotificationItem({ notification, isSelected, onSelect, onMarkAsRead }: NotificationItemProps) {
  const isUnread = !notification.readAt
  const icon = notificationService.getNotificationIcon(notification.type)
  const colorClass = notificationService.getNotificationColor(notification.type)
  const timeAgo = notificationService.formatRelativeTime(notification.createdAt)

  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50' : ''}`}>
      <div className="flex items-start space-x-3">
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />

        {/* Notification Icon */}
        <div className={`flex-shrink-0 text-2xl ${colorClass}`}>
          {icon}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h4>
              <p className={`mt-1 text-sm ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
                {notification.message}
              </p>
              
              {/* Notification metadata */}
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span>{timeAgo}</span>
                
                {notification.channels && notification.channels.length > 0 && (
                  <span className="flex items-center space-x-1">
                    <span>via</span>
                    {notification.channels.map((channel, index) => (
                      <span key={channel} className="inline-flex items-center">
                        {channel === 'email' && '📧'}
                        {channel === 'sms' && '📱'}
                        {channel === 'in_app' && '🔔'}
                        <span className="ml-1">{channel}</span>
                        {index < notification.channels.length - 1 && <span className="mx-1">•</span>}
                      </span>
                    ))}
                  </span>
                )}
                
                {notification.scheduledFor && (
                  <span>Scheduled for {format(new Date(notification.scheduledFor), 'MMM d, h:mm a')}</span>
                )}
              </div>
            </div>

            {/* Action Button */}
            {isUnread && (
              <button
                onClick={onMarkAsRead}
                className="ml-4 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}