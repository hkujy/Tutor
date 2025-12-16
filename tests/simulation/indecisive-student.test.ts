import { db } from '../../src/lib/db/client'
import { createMocks } from 'node-mocks-http'
import { POST, DELETE } from '../../src/app/api/appointments/route'
import { getServerSession } from 'next-auth'

// Setup mocks
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
      if (url.includes('?')) {
        this.searchParams = new URLSearchParams(url.split('?')[1])
      } else {
        this.searchParams = new URLSearchParams()
      }
    }
    searchParams: URLSearchParams
    async json() { return {} }
  }
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('../../src/lib/db/client', () => ({
  db: {
    appointment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

describe('Simulation: The Indecisive Student', () => {
  let appointments: any[] = []
  
  beforeEach(() => {
    jest.clearAllMocks()
    appointments = []

    // Access the mocked functions
    const mockDb = db as unknown as {
      appointment: {
        findFirst: jest.Mock
        create: jest.Mock
        findUnique: jest.Mock
        update: jest.Mock
      }
      student: { findUnique: jest.Mock }
      tutor: { findUnique: jest.Mock }
      notification: { create: jest.Mock }
    }

    // 1. Mock FindFirst (Conflict Check)
    mockDb.appointment.findFirst.mockImplementation(async ({ where }) => {
      if (where.OR) {
         const { tutorId, OR } = where
         const timeCheck = OR[0]
         const requestedStart = timeCheck.startTime.lt
         const requestedEnd = timeCheck.endTime.gt
 
         const conflict = appointments.find(appt => 
           appt.tutorId === tutorId &&
           appt.status !== 'CANCELLED' &&
           new Date(appt.startTime).getTime() < new Date(requestedEnd).getTime() &&
           new Date(appt.endTime).getTime() > new Date(requestedStart).getTime()
         )
         return conflict || null
      }
      return null
    })

    // 2. Mock Create
    mockDb.appointment.create.mockImplementation(async ({ data }) => {
        const newAppt = {
            id: `appt-${appointments.length + 1}`,
            ...data,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            status: 'SCHEDULED',
            createdAt: new Date(),
            updatedAt: new Date()
        }
        appointments.push(newAppt)
        return newAppt
    })

    // 3. Mock FindUnique
    mockDb.appointment.findUnique.mockImplementation(async ({ where }) => {
        return appointments.find(a => a.id === where.id) || null
    })

    // 4. Mock Update
    mockDb.appointment.update.mockImplementation(async ({ where, data }) => {
        const apptIndex = appointments.findIndex(a => a.id === where.id)
        if (apptIndex > -1) {
            appointments[apptIndex] = { ...appointments[apptIndex], ...data }
            return appointments[apptIndex]
        }
        throw new Error('Appointment not found')
    })

    mockDb.student.findUnique.mockResolvedValue({
      user: { id: 's-1', firstName: 'Frank', lastName: 'Student', email: 'frank@test.com' }
    })
    mockDb.tutor.findUnique.mockResolvedValue({
      id: 'tutor-1',
      user: { firstName: 'Ms.', lastName: 'Jones' }
    })
    mockDb.notification.create.mockResolvedValue({})
  })

  const simulateBooking = async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'STUDENT', studentId: 'student-frank' }
    })

    const body = {
      tutorId: 'tutor-1',
      studentId: 'student-frank',
      date: '2023-10-20',
      time: '14:00',
      subject: 'History',
      duration: 60
    }

    const { req } = createMocks({
      method: 'POST',
      body,
    })
    req.json = jest.fn().mockResolvedValue(body)

    return POST(req as any)
  }

  const simulateCancellation = async (appointmentId: string) => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'STUDENT', studentId: 'student-frank' }
    })

    const { req } = createMocks({
      method: 'DELETE',
      url: `http://localhost/api/appointments?id=${appointmentId}`
    })

    return DELETE(req as any)
  }

  it('should allow booking, cancelling, and re-booking the same slot', async () => {
    const booking1 = await simulateBooking()
    expect(booking1.status).toBe(201)
    const apptId = (await booking1.json()).appointment.id
    
    const appt1 = appointments.find(a => a.id === apptId)
    expect(appt1.status).toBe('SCHEDULED')

    const cancel1 = await simulateCancellation(apptId)
    expect(cancel1.status).toBe(200)

    const appt1Cancelled = appointments.find(a => a.id === apptId)
    expect(appt1Cancelled.status).toBe('CANCELLED')

    const booking2 = await simulateBooking()
    expect(booking2.status).toBe(201)
    
    const apptId2 = (await booking2.json()).appointment.id
    expect(apptId2).not.toBe(apptId)

    expect(appointments).toHaveLength(2)
    expect(appointments[0].status).toBe('CANCELLED')
    expect(appointments[1].status).toBe('SCHEDULED')
    
    expect(db.notification.create).toHaveBeenCalledTimes(2)
  })
})