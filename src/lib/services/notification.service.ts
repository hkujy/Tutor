interface Notification {
  id: string
  title: string
  message: string
  type: string
  channels: string[]
  readAt: string | null
  scheduledFor: string | null
  sentAt: string | null
  emailSent: boolean
  smsSent: boolean
  createdAt: string
  data?: any
}

interface NotificationPreferences {
  emailNotifications: boolean
  smsNotifications: boolean
  reminderTiming: number
  assignmentReminders: boolean
  marketingEmails: boolean
  createdAt?: string
  updatedAt?: string
}

interface NotificationsResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  unreadCount: number
}

class NotificationService {
  private baseURL = '/api/notifications'

  async getNotifications(params?: {
    page?: number
    limit?: number
    unread?: boolean
    type?: string
  }): Promise<NotificationsResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.unread) searchParams.append('unread', 'true')
    if (params?.type) searchParams.append('type', params.type)

    const response = await fetch(`${this.baseURL}?${searchParams}`)
    if (!response.ok) {
      throw new Error('Failed to fetch notifications')
    }
    return response.json()
  }

  async markAsRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/${notificationId}/read`, {
      method: 'PATCH'
    })
    if (!response.ok) {
      throw new Error('Failed to mark notification as read')
    }
  }

  async bulkMarkAsRead(notificationIds?: string[], markAll?: boolean): Promise<{ count: number }> {
    const response = await fetch(`${this.baseURL}/bulk-mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificationIds,
        markAllAsRead: markAll
      })
    })
    if (!response.ok) {
      throw new Error('Failed to mark notifications as read')
    }
    return response.json()
  }

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await fetch(`${this.baseURL}/preferences`)
    if (!response.ok) {
      throw new Error('Failed to fetch notification preferences')
    }
    const data = await response.json()
    return data.preferences
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await fetch(`${this.baseURL}/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferences)
    })
    if (!response.ok) {
      throw new Error('Failed to update notification preferences')
    }
    const data = await response.json()
    return data.preferences
  }

  async sendNotification(data: {
    userId: string
    type: string
    title: string
    message: string
    channels?: string[]
    scheduledFor?: string
    data?: any
  }): Promise<Notification> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      throw new Error('Failed to send notification')
    }
    const result = await response.json()
    return result.notification
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'APPOINTMENT_REMINDER': '📅',
      'ASSIGNMENT_DUE': '📚',
      'CANCELLATION': '❌',
      'CONFIRMATION': '✅',
      'SYSTEM_ANNOUNCEMENT': '📢',
      'PAYMENT_REMINDER': '💰',
      'PAYMENT_RECEIVED': '💸'
    }
    return icons[type] || '🔔'
  }

  getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
      'APPOINTMENT_REMINDER': 'text-blue-600',
      'ASSIGNMENT_DUE': 'text-orange-600',
      'CANCELLATION': 'text-red-600',
      'CONFIRMATION': 'text-green-600',
      'SYSTEM_ANNOUNCEMENT': 'text-purple-600',
      'PAYMENT_REMINDER': 'text-yellow-600',
      'PAYMENT_RECEIVED': 'text-green-600'
    }
    return colors[type] || 'text-gray-600'
  }

  formatRelativeTime(dateString: string): string {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }
}

export const notificationService = new NotificationService()
export type { Notification, NotificationPreferences, NotificationsResponse }