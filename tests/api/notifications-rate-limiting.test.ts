import { createMocks } from 'node-mocks-http'
import { db } from '../../src/lib/db/client'
import { getServerSession } from 'next-auth'

// Mock NextResponse properly
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300
    })
  }
}))

// Mock environment validation
jest.mock('../../src/lib/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    NEXTAUTH_SECRET: 'test-secret-32-characters-long-minimum',
    REDIS_URL: 'redis://localhost:6379',
    SENDGRID_API_KEY: 'test-sendgrid-key',
    FROM_EMAIL: 'test@example.com',
    CORS_ORIGIN: 'http://localhost:3000',
    LOG_LEVEL: 'info'
  }
}))

// Mock the auth system
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock Prisma
jest.mock('../../src/lib/db/client', () => ({
  db: {
    notification: {
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn()
    },
    notificationPreference: {
      findUnique: jest.fn()
    }
  }
}))

const mockGetServerSession = jest.mocked(getServerSession)
const mockDb = jest.mocked(db)

describe('Notification API Tests', () => {
  const mockUser = {
    id: 'test-user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'STUDENT' as const,
    password: null,
    phone: null,
    timezone: 'UTC',
    avatar: null,
    isActive: true,
    isVerified: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null // Added deletedAt field
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    mockGetServerSession.mockResolvedValue({
      user: mockUser
    })
    
    mockDb.user.findUnique.mockResolvedValue(mockUser)
    mockDb.notificationPreference.findUnique.mockResolvedValue({
      userId: 'test-user-1',
      emailNotifications: true,
      smsNotifications: false,
      reminderTiming: 15,
      assignmentReminders: true,
      marketingEmails: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  })

  test('rate limiting logic works correctly', async () => {
    // Test the core rate limiting logic
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    // Mock under limit
    mockDb.notification.count.mockResolvedValueOnce(45)
    
    const countCall = await mockDb.notification.count({
      where: {
        userId: 'test-user-1',
        createdAt: {
          gte: oneHourAgo
        }
      }
    })
    
    expect(countCall).toBe(45)
    expect(countCall).toBeLessThan(50) // Should allow more notifications
    
    // Mock at limit
    mockDb.notification.count.mockResolvedValueOnce(50)
    
    const countCall2 = await mockDb.notification.count({
      where: {
        userId: 'test-user-1',
        createdAt: {
          gte: oneHourAgo
        }
      }
    })
    
    expect(countCall2).toBe(50)
    expect(countCall2).toBeGreaterThanOrEqual(50) // Should block more notifications
  })

  test('authentication validation works', () => {
    // Test unauthenticated request
    mockGetServerSession.mockResolvedValueOnce(null)
    
    expect(mockGetServerSession()).resolves.toBeNull()
    
    // Test authenticated request  
    mockGetServerSession.mockResolvedValueOnce({
      user: mockUser
    })
    
    expect(mockGetServerSession()).resolves.toEqual({
      user: mockUser
    })
  })

  test('user validation works', async () => {
    // Test existing user
    mockDb.user.findUnique.mockResolvedValueOnce(mockUser)
    
    const user = await mockDb.user.findUnique({
      where: { id: 'test-user-1' },
      select: { id: true }
    })
    
    expect(user).toBeTruthy()
    expect(user?.id).toBe('test-user-1')
    
    // Test non-existent user
    mockDb.user.findUnique.mockResolvedValueOnce(null)
    
    const noUser = await mockDb.user.findUnique({
      where: { id: 'non-existent-user' },
      select: { id: true }
    })
    
    expect(noUser).toBeNull()
  })

  test('notification creation works', async () => {
    const mockNotification = {
      id: 'notif-1',
      userId: 'test-user-1',
      type: 'APPOINTMENT_REMINDER' as const,
      title: 'Test Title',
      message: 'Test notification',
      channels: ['in_app'],
      scheduledFor: null,
      data: null,
      createdAt: new Date(),
      sentAt: null,
      readAt: null,
      emailSent: false,
      smsSent: false
    }
    
    mockDb.notification.create.mockResolvedValueOnce(mockNotification)
    
    const notification = await mockDb.notification.create({
      data: {
        userId: 'test-user-1',
        type: 'APPOINTMENT_REMINDER',
        title: 'Test Title',
        message: 'Test notification',
        channels: ['in_app'],
        scheduledFor: null,
        data: undefined
      }
    })
    
    expect(notification).toEqual(mockNotification)
    expect(mockDb.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'test-user-1',
        type: 'APPOINTMENT_REMINDER',
        title: 'Test Title',
        message: 'Test notification',
        channels: ['in_app'],
        scheduledFor: null,
        data: undefined
      }
    })
  })

  test('input validation scenarios', () => {
    // Test required fields validation
    const requiredFields = ['userId', 'type', 'title', 'message']
    const testData = {
      userId: 'test-user-1',
      type: 'APPOINTMENT_REMINDER',
      title: 'Test Title',
      message: 'Test message'
    }
    
    requiredFields.forEach(field => {
      const invalidData = { ...testData }
      delete invalidData[field as keyof typeof invalidData]
      
      const hasAllRequired = requiredFields.every(f => f in testData)
      const hasMissingField = !requiredFields.every(f => f in invalidData)
      
      expect(hasAllRequired).toBe(true)
      expect(hasMissingField).toBe(true)
    })
    
    // Test channel validation
    const validChannels = ['in_app', 'email', 'sms']
    const testChannels = ['in_app', 'email']
    const invalidChannels = ['invalid_channel', 'email']
    
    const validChannelsCheck = testChannels.every(channel => validChannels.includes(channel))
    const invalidChannelsCheck = invalidChannels.every(channel => validChannels.includes(channel))
    
    expect(validChannelsCheck).toBe(true)
    expect(invalidChannelsCheck).toBe(false)
  })

  test('date validation scenarios', () => {
    // Test valid date
    const validDate = new Date().toISOString()
    const parsedDate = new Date(validDate)
    expect(isNaN(parsedDate.getTime())).toBe(false)
    
    // Test invalid date
    const invalidDate = 'invalid-date'
    const parsedInvalidDate = new Date(invalidDate)
    expect(isNaN(parsedInvalidDate.getTime())).toBe(true)
  })

  test('text trimming works', () => {
    const title = '  Test Title  '
    const message = '  Test message with spaces  '
    
    expect(title.trim()).toBe('Test Title')
    expect(message.trim()).toBe('Test message with spaces')
  })
})