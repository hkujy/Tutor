import { createMocks } from 'node-mocks-http'
import { POST } from '../../src/app/api/appointments/route'
import { db } from '../../src/lib/db/client'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      id: 'tutor-user-1',
      email: 'tutor@example.com',
      role: 'TUTOR',
      tutorId: 'tutor-1'
    }
  })
}))

// Mock NextResponse properly
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300
    })
  },
  NextRequest: class {
    url: string
    constructor(url: string) {
      this.url = url
    }
  }
}))

// Mock the database
jest.mock('../../src/lib/db/client', () => ({
  db: {
    appointment: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
    tutor: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}))

describe('/api/appointments POST (Tutor Creation)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create appointment and send notification', async () => {
    const mockAppointment = {
      id: 'appointment-1',
      tutorId: 'tutor-1',
      studentId: 'student-1',
      subject: 'Mathematics',
      startTime: new Date('2025-10-15T10:00:00Z'),
      endTime: new Date('2025-10-15T11:00:00Z'),
      status: 'SCHEDULED',
      notes: 'Test appointment',
    }

    const mockStudent = {
      id: 'student-1',
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
    }

    const mockTutor = {
      id: 'tutor-1',
      user: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
    }

      ; (db.appointment.create as jest.Mock).mockResolvedValue(mockAppointment)
      ; (db.appointment.findFirst as jest.Mock).mockResolvedValue(null) // No conflict
      ; (db.student.findUnique as jest.Mock).mockResolvedValue(mockStudent)
      ; (db.tutor.findUnique as jest.Mock).mockResolvedValue(mockTutor)
      ; (db.notification.create as jest.Mock).mockResolvedValue({})

    const requestBody = {
      tutorId: 'tutor-1',
      studentId: 'student-1',
      date: '2025-10-15',
      time: '10:00',
      subject: 'Mathematics',
      duration: 60,
      notes: 'Test appointment created by tutor',
    }

    const { req } = createMocks({
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Mock the json method
    req.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.appointment).toEqual(mockAppointment)

    // Verify appointment was created
    expect(db.appointment.create).toHaveBeenCalledWith({
      data: {
        tutorId: 'tutor-1',
        studentId: 'student-1',
        startTime: new Date('2025-10-15T10:00:00Z'),
        endTime: new Date('2025-10-15T11:00:00Z'),
        subject: 'Mathematics',
        status: 'SCHEDULED',
        notes: 'Test appointment created by tutor',
        currency: 'USD',
        hourlyRate: expect.anything(),
        totalCost: expect.anything()
      },
    })

    // Verify notification was created
    expect(db.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'APPOINTMENT_REMINDER',
        title: 'New Appointment Scheduled',
        message: expect.stringContaining('Jane Smith has scheduled a Mathematics session'),
        channels: ['in_app', 'email'],
        data: {
          appointmentId: 'appointment-1',
          tutorName: 'Jane Smith',
          subject: 'Mathematics',
          startTime: '2025-10-15T10:00:00.000Z',
          endTime: '2025-10-15T11:00:00.000Z',
        },
      },
    })
  })
})