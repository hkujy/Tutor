
import { notificationService } from '../../../src/lib/services/notification.service'

// Mock global fetch
global.fetch = jest.fn()

describe('NotificationService', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear()
  })

  describe('getNotifications', () => {
    it('should fetch notifications with correct params', async () => {
      const mockResponse = { notifications: [], pagination: {}, unreadCount: 0 }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      await notificationService.getNotifications({ page: 1, limit: 10, unread: true })

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications?page=1&limit=10&unread=true')
    })
  })

  describe('markAsRead', () => {
    it('should call PATCH endpoint', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

      await notificationService.markAsRead('123')

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/123/read', {
        method: 'PATCH'
      })
    })
  })

  describe('Utility Methods', () => {
    it('should return correct icons for types', () => {
      expect(notificationService.getNotificationIcon('APPOINTMENT_REMINDER')).toBe('📅')
      expect(notificationService.getNotificationIcon('UNKNOWN_TYPE')).toBe('🔔')
    })

    it('should return correct colors for types', () => {
        expect(notificationService.getNotificationColor('CANCELLATION')).toBe('text-red-600')
        expect(notificationService.getNotificationColor('UNKNOWN')).toBe('text-gray-600')
    })

    it('should format relative time correctly', () => {
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 1000 * 60 * 60).toISOString()
        const oneMinuteAgo = new Date(now.getTime() - 1000 * 60).toISOString()
        
        expect(notificationService.formatRelativeTime(oneHourAgo)).toContain('1h ago')
        expect(notificationService.formatRelativeTime(oneMinuteAgo)).toContain('1m ago')
    })
  })
})
