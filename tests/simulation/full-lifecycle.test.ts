import { db } from '../../src/lib/db/client'
import { createMocks } from 'node-mocks-http'
import { POST as AppointmentPOST, PUT as AppointmentPUT } from '../../src/app/api/appointments/route'
import { getServerSession } from 'next-auth'

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

// Define keys to ensure they exist on the mock object
jest.mock('../../src/lib/db/client', () => {
    // We create a mock Db object
    const mockDb: any = {
        appointment: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn(),
        },
        student: { findUnique: jest.fn() },
        tutor: { findUnique: jest.fn() },
        notification: { create: jest.fn() },
        lectureHours: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
        lectureSession: { create: jest.fn() },
    }
    // Mock transaction to pass the mockDb itself as 'tx'
    mockDb.$transaction = jest.fn((callback: any) => callback(mockDb))
    
    return {
        db: mockDb
    }
})

describe('Simulation: Full Lifecycle', () => {
  let apptId: string
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    const mockDb = db as any

    mockDb.student.findUnique.mockResolvedValue({
      user: { id: 's-1', firstName: 'S', lastName: 'Student', email: 's@test.com', userId: 'user-s-1' }
    })
    mockDb.tutor.findUnique.mockResolvedValue({
      id: 'tutor-1',
      userId: 'user-t-1',
      user: { firstName: 'T', lastName: 'Tutor', email: 't@test.com' }
    })
    
    mockDb.appointment.create.mockImplementation(({ data }: any) => ({
      id: 'appt-123',
      ...data,
      status: 'SCHEDULED'
    }))

    mockDb.appointment.update.mockImplementation(({ data }: any) => ({
        id: 'appt-123',
        ...data,
        startTime: new Date('2023-10-01T10:00:00Z'),
        endTime: new Date('2023-10-01T11:00:00Z'),
        student: { user: { userId: 'user-s-1', firstName: 'S', lastName: 'Student' } },
        tutor: { user: { userId: 'user-t-1' } },
        subject: 'Math'
    }))
    
    mockDb.lectureHours.findUnique.mockResolvedValue(null)
    mockDb.lectureHours.create.mockResolvedValue({ id: 'lh-1', unpaidHours: 1, paymentInterval: 10 })
  })

  it('should complete the full lifecycle from booking to completion', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'STUDENT', studentId: 'student-1' }
    })
    const bookingReq = {
      tutorId: 'tutor-1',
      studentId: 'student-1',
      date: '2023-10-01',
      time: '10:00',
      subject: 'Math',
      duration: 60
    }
    
    const { req: postReq } = createMocks({ method: 'POST', body: bookingReq })
    postReq.json = jest.fn().mockResolvedValue(bookingReq)
    
    const postRes = await AppointmentPOST(postReq as any)
    expect(postRes.status).toBe(201)
    apptId = (await postRes.json()).appointment.id
    
    // Completion
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'TUTOR', tutorId: 'tutor-1' }
    })
    
    const completeReq = {
      id: apptId,
      status: 'COMPLETED'
    }
    
    const { req: putReq } = createMocks({ method: 'PUT', body: completeReq })
    putReq.json = jest.fn().mockResolvedValue(completeReq)
    
    const putRes = await AppointmentPUT(putReq as any)
    expect(putRes.status).toBe(200)

    expect(db.$transaction).toHaveBeenCalled()
    // Since we passed 'db' as 'tx', calls on tx are calls on db
    expect(db.lectureHours.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            totalHours: 1,
            subject: 'Math'
        })
    }))
    
    expect(db.lectureSession.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            appointmentId: 'appt-123',
            duration: 1
        })
    }))
  })
})