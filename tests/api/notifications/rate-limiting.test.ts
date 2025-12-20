import { POST } from '../../../src/app/api/notifications/route'
import { db } from '../../../src/lib/db/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: class {
    constructor(public url: string, public init?: any) {}
    json() { return Promise.resolve(JSON.parse(this.init?.body || '{}')) }
  },
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

// Mock dependencies
jest.mock('../../../src/lib/db/client', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
    },
    systemSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    smsUsage: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock SMS service to avoid actual calls (though we mocked db so logic might not reach it if we control flow)
jest.mock('../../../src/lib/services/sms.service', () => ({
  smsService: {
    send: jest.fn(),
  },
}))

describe('Notification API Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default auth session
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', role: 'STUDENT' },
    })
  })

  it('should log a warning and skip processing if rate limit is exceeded', async () => {
    // Setup mocks
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    
    // Mock user exists
    ;(db.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123' })
    
    // Mock notification creation success
    ;(db.notification.create as jest.Mock).mockResolvedValue({
      id: 'notif-1',
      userId: 'user-123',
      title: 'Test',
      message: 'Test',
      channels: ['sms'],
      createdAt: new Date(),
    })

    // Mock high recent notification count (>= 50)
    ;(db.notification.count as jest.Mock).mockResolvedValue(55)

    const req = new Request('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user-123',
        type: 'APPOINTMENT_REMINDER',
        title: 'Test',
        message: 'Test',
        channels: ['sms'],
      }),
    })

    // Execute
    const res = await POST(req as any)
    
    // Verify
    expect(res.status).toBe(201) // Creation still succeeds
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Rate limit exceeded'))
    
    // Ensure update (which happens after sending) was NOT called
    expect(db.notification.update).not.toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })

  it('should process notification if within rate limit', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    
    // Mock user exists with preferences
    ;(db.user.findUnique as jest.Mock).mockResolvedValue({ 
      id: 'user-123',
      phone: '1234567890',
      notificationPreference: {
        smsNotifications: true,
        emailNotifications: false,
      }
    })

    ;(db.notification.create as jest.Mock).mockResolvedValue({
      id: 'notif-2',
      userId: 'user-123',
      channels: ['sms'],
      createdAt: new Date(),
    })

    // Low count
    ;(db.notification.count as jest.Mock).mockResolvedValue(10)
    
    // Mock system settings for budget (allow)
    ;(db.systemSettings.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.key === 'sms_monthly_budget') return { value: '100' }
      if (where.key === 'sms_current_month_spend') return { value: '0' }
      if (where.key === 'sms_daily_cap_per_user') return { value: '10' }
      return null
    })
    
    // Mock sms usage (allow)
    ;(db.smsUsage.findUnique as jest.Mock).mockResolvedValue({ count: 0 })

    const req = new Request('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user-123',
        type: 'APPOINTMENT_REMINDER',
        title: 'Test',
        message: 'Test',
        channels: ['sms'],
      }),
    })

    await POST(req as any)

    // Verify
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Rate limit exceeded'))
    // Should attempt to update notification (sentAt, etc.)
    expect(db.notification.update).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})
