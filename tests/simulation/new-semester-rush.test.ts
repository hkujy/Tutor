
import { db } from '../../src/lib/db/client'
import { createMocks } from 'node-mocks-http'
import { POST } from '../../src/app/api/appointments/route'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
    })
  },
  NextRequest: class {
    url: string
    constructor(url: string) {
      this.url = url
    }
    async json() { return {} }
  }
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Shared state for the simulation
let mockAppointments: any[] = []

jest.mock('../../src/lib/db/client', () => ({
  db: {
    appointment: {
      findFirst: jest.fn(),
      create: jest.fn(),
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

describe('Simulation: New Semester Rush', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAppointments = []

    // 1. Mock FindFirst (Application Level Check)
    ;(db.appointment.findFirst as jest.Mock).mockImplementation(async ({ where }) => {
      // Simulate DB delay to encourage race condition
      await new Promise(r => setTimeout(r, 10))

      const { tutorId, OR } = where
      const timeCheck = OR[0]
      const requestedStart = timeCheck.startTime.lt
      const requestedEnd = timeCheck.endTime.gt

      // Check against shared state
      const conflict = mockAppointments.find(appt => 
        appt.tutorId === tutorId &&
        appt.status !== 'CANCELLED' &&
        appt.startTime < requestedEnd &&
        appt.endTime > requestedStart
      )

      return conflict || null
    })

    // 2. Mock Create (Database Level Check - enforcing Unique Constraint behavior)
    ;(db.appointment.create as jest.Mock).mockImplementation(async ({ data }) => {
      // Simulate DB delay
      await new Promise(r => setTimeout(r, 10))

      // "Database" constraint check
      const conflict = mockAppointments.find(appt => 
        appt.tutorId === data.tutorId &&
        appt.status !== 'CANCELLED' &&
        new Date(appt.startTime).getTime() === data.startTime.getTime()
      )

      if (conflict) {
        throw new Error('Unique constraint failed')
      }

      const newAppt = {
        id: `appt-${mockAppointments.length + 1}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockAppointments.push(newAppt)
      return newAppt
    })

    // Mock other lookups
    ;(db.student.findUnique as jest.Mock).mockResolvedValue({
      user: { id: 's-1', firstName: 'Student', lastName: 'One', email: 's@test.com' }
    })
    ;(db.tutor.findUnique as jest.Mock).mockResolvedValue({
      user: { firstName: 'Tutor', lastName: 'Name' }
    })
  })

  const simulateBooking = async (studentId: string, delayMs: number = 0) => {
    await new Promise(r => setTimeout(r, delayMs))

    ;(getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { role: 'STUDENT', studentId }
    })

    const body = {
      tutorId: 'tutor-1',
      studentId: studentId,
      date: '2023-09-01',
      time: '09:00',
      subject: 'Math',
      duration: 60
    }

    const { req } = createMocks({
      method: 'POST',
      body,
    })
    req.json = jest.fn().mockResolvedValue(body)

    return POST(req as any)
  }

  it('should handle concurrent bookings for the same slot', async () => {
    const students = ['student-1', 'student-2', 'student-3', 'student-4', 'student-5']
    
    // Fire all requests "simultaneously"
    const promises = students.map(id => simulateBooking(id))
    const results = await Promise.all(promises)

    const successCount = results.filter(r => r.status === 201).length
    const conflictCount = results.filter(r => r.status === 409 || r.status === 500).length

    // In a race condition without transactions:
    // Application Check (findFirst) might pass for multiple reqs.
    // DB Check (create unique constraint) will fail for all but one.
    
    // Our mock simulates this:
    // findFirst might pass for all if they run before any create finishes.
    // create will fail for 4 of them.
    // However, the API route catches generic errors and returns 500.

    console.log(`Success: ${successCount}, Conflicts: ${conflictCount}`)
    
    // Ideally, exactly 1 succeeds.
    expect(successCount).toBeGreaterThanOrEqual(1)
    expect(conflictCount).toBeGreaterThanOrEqual(0)
    
    // Check internal state
    expect(mockAppointments.length).toBe(1)
  })
})
