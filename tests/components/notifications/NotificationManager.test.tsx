import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import NotificationManager from '../../../src/components/notifications/NotificationManager'
import { notificationService } from '../../../src/lib/services/notification.service'

// Mock notification service
jest.mock('../../../src/lib/services/notification.service', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    bulkMarkAsRead: jest.fn(),
    getNotificationIcon: jest.fn(() => '🔔'),
    getNotificationColor: jest.fn(() => 'text-blue-500'),
    formatRelativeTime: jest.fn(() => 'Just now'),
  },
}))

// Mock next-intl
// Mock next-intl (removed - using global in jest.setup.ts)

describe('NotificationManager', () => {
  const mockNotifications = [
    {
      id: '1',
      title: 'Test Notification 1',
      message: 'This is a test message',
      type: 'APPOINTMENT_REMINDER',
      channels: ['in_app'],
      readAt: null, // Unread
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Test Notification 2',
      message: 'Another message',
      type: 'SYSTEM_ANNOUNCEMENT',
      channels: ['email'],
      readAt: new Date().toISOString(), // Read
      createdAt: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
      ; (notificationService.getNotifications as jest.Mock).mockResolvedValue({
        notifications: mockNotifications,
        pagination: { page: 1, limit: 20, total: 2, pages: 1 },
        unreadCount: 1,
      })
  })

  it('renders loading state initially', async () => {
    // Delay resolution to catch loading state
    ; (notificationService.getNotifications as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        notifications: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 1 },
        unreadCount: 0,
      }), 100))
    )

    render(<NotificationManager userId="user-1" userRole="student" />)

    // Check for skeletons (checking by class or structure might be brittle, let's assume skeletons render some generic container or just check it doesn't show "No notifications")
    // In our component, loading + empty notifications renders skeletons.
    // We can check if the "title" is present, as it renders even when loading? 
    // Actually, in `if (loading && notifications.length === 0)` block, it returns skeletons WITHOUT the header title "title".

    expect(screen.queryByText('title')).not.toBeInTheDocument()
  })

  it('renders notifications after loading', async () => {
    render(<NotificationManager userId="user-1" userRole="student" />)

    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })

    expect(screen.getByText('Test Notification 1')).toBeInTheDocument()
    expect(screen.getByText('Test Notification 2')).toBeInTheDocument()
    expect(screen.getByText('unreadCount')).toBeInTheDocument() // "unreadCount" is key from mock t()
  })

  it('handles empty state', async () => {
    ; (notificationService.getNotifications as jest.Mock).mockResolvedValue({
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 1 },
      unreadCount: 0,
    })

    render(<NotificationManager userId="user-1" userRole="student" />)

    await waitFor(() => {
      expect(screen.getByText('empty.title')).toBeInTheDocument()
    })
  })

  it('allows marking a notification as read', async () => {
    render(<NotificationManager userId="user-1" userRole="student" />)

    await waitFor(() => {
      expect(screen.getByText('Test Notification 1')).toBeInTheDocument()
    })

    // Find "Mark as Read" button for the unread notification
    const markReadBtn = screen.getByText('markAsRead')
    fireEvent.click(markReadBtn)

    await waitFor(() => {
      expect(notificationService.markAsRead).toHaveBeenCalledWith('1')
    })
  })
})
