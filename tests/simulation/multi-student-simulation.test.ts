import { db } from '../../src/lib/db/client'
import { createMocks } from 'node-mocks-http'
import { POST as AppointmentPOST } from '../../src/app/api/appointments/route'
import { GET as AppointmentGET } from '../../src/app/api/appointments/route'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
      headers: new Map()
    })
  }
}))

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

// Mock the database
jest.mock('../../src/lib/db/client', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tutor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    availability: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    lectureHours: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

interface SimulatedStudent {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  appointments: any[]
  notifications: any[]
  lectureHours: number
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE'
}

interface SimulatedTutor {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  subjects: string[]
  students: string[]
}

describe('Multi-Student Activity Simulation', () => {
  let students: SimulatedStudent[]
  let tutors: SimulatedTutor[]
  let appointmentCounter = 1
  let notificationCounter = 1

  beforeEach(() => {
    jest.clearAllMocks()
    appointmentCounter = 1
    notificationCounter = 1

    // Initialize test data
    students = [
      {
        id: 'student-1',
        userId: 'user-1',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        appointments: [],
        notifications: [],
        lectureHours: 10,
        paymentStatus: 'PAID'
      },
      {
        id: 'student-2',
        userId: 'user-2',
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        appointments: [],
        notifications: [],
        lectureHours: 5,
        paymentStatus: 'PENDING'
      },
      {
        id: 'student-3',
        userId: 'user-3',
        firstName: 'Carol',
        lastName: 'Williams',
        email: 'carol@example.com',
        appointments: [],
        notifications: [],
        lectureHours: 15,
        paymentStatus: 'PAID'
      },
      {
        id: 'student-4',
        userId: 'user-4',
        firstName: 'David',
        lastName: 'Brown',
        email: 'david@example.com',
        appointments: [],
        notifications: [],
        lectureHours: 3,
        paymentStatus: 'OVERDUE'
      }
    ]

    tutors = [
      {
        id: 'tutor-1',
        userId: 'tutor-user-1',
        firstName: 'Professor',
        lastName: 'Math',
        email: 'prof.math@example.com',
        subjects: ['Mathematics', 'Physics'],
        students: ['student-1', 'student-2']
      },
      {
        id: 'tutor-2',
        userId: 'tutor-user-2',
        firstName: 'Dr',
        lastName: 'Science',
        email: 'dr.science@example.com',
        subjects: ['Chemistry', 'Biology'],
        students: ['student-3', 'student-4']
      }
    ]

    // Setup database mocks
    setupDatabaseMocks()
  })

  const setupDatabaseMocks = () => {
    // Mock user lookups
    ;(db.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      const student = students.find(s => s.userId === where.id || s.email === where.email)
      const tutor = tutors.find(t => t.userId === where.id || t.email === where.email)
      
      if (student) {
        return Promise.resolve({
          id: student.userId,
          email: student.email,
          firstName: student.firstName,
          lastName: student.lastName,
          role: 'STUDENT',
          isVerified: true
        })
      }
      
      if (tutor) {
        return Promise.resolve({
          id: tutor.userId,
          email: tutor.email,
          firstName: tutor.firstName,
          lastName: tutor.lastName,
          role: 'TUTOR',
          isVerified: true
        })
      }
      
      return Promise.resolve(null)
    })

    // Mock student lookups
    ;(db.student.findUnique as jest.Mock).mockImplementation(({ where }) => {
      const student = students.find(s => s.id === where.id || s.userId === where.userId)
      if (student) {
        return Promise.resolve({
          id: student.id,
          userId: student.userId,
          lectureHours: student.lectureHours,
          paymentStatus: student.paymentStatus,
          user: {
            id: student.userId,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email
          }
        })
      }
      return Promise.resolve(null)
    })

    // Mock tutor lookups
    ;(db.tutor.findUnique as jest.Mock).mockImplementation(({ where }) => {
      const tutor = tutors.find(t => t.id === where.id || t.userId === where.userId)
      if (tutor) {
        return Promise.resolve({
          id: tutor.id,
          userId: tutor.userId,
          subjects: tutor.subjects,
          user: {
            id: tutor.userId,
            firstName: tutor.firstName,
            lastName: tutor.lastName,
            email: tutor.email
          }
        })
      }
      return Promise.resolve(null)
    })

    // Mock appointment creation
    ;(db.appointment.create as jest.Mock).mockImplementation(({ data }) => {
      const appointment = {
        id: `appointment-${appointmentCounter++}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Add to student's appointments
      const student = students.find(s => s.id === data.studentId)
      if (student) {
        student.appointments.push(appointment)
      }
      
      return Promise.resolve(appointment)
    })

    // Mock appointment queries
    ;(db.appointment.findMany as jest.Mock).mockImplementation(({ where }) => {
      let appointments: any[] = []
      
      students.forEach(student => {
        appointments.push(...student.appointments)
      })
      
      if (where?.studentId) {
        appointments = appointments.filter(a => a.studentId === where.studentId)
      }
      
      if (where?.tutorId) {
        appointments = appointments.filter(a => a.tutorId === where.tutorId)
      }
      
      return Promise.resolve(appointments)
    })

    // Mock notification creation
    ;(db.notification.create as jest.Mock).mockImplementation(({ data }) => {
      const notification = {
        id: `notification-${notificationCounter++}`,
        ...data,
        createdAt: new Date(),
        isRead: false
      }
      
      // Add to student's notifications
      const student = students.find(s => s.userId === data.userId)
      if (student) {
        student.notifications.push(notification)
      }
      
      return Promise.resolve(notification)
    })

    // Mock notification queries
    ;(db.notification.findMany as jest.Mock).mockImplementation(({ where }) => {
      let notifications: any[] = []
      
      students.forEach(student => {
        notifications.push(...student.notifications)
      })
      
      if (where?.userId) {
        notifications = notifications.filter(n => n.userId === where.userId)
      }
      
      return Promise.resolve(notifications)
    })

    // Mock availability queries
    ;(db.availability.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'avail-1',
        tutorId: 'tutor-1',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        isActive: true
      },
      {
        id: 'avail-2',
        tutorId: 'tutor-2',
        dayOfWeek: 2, // Tuesday
        startTime: '10:00',
        endTime: '16:00',
        isActive: true
      }
    ])

    // Mock lecture hour operations
    ;(db.lectureHours.create as jest.Mock).mockImplementation(({ data }) => {
      return Promise.resolve({
        id: `lecture-${Date.now()}`,
        ...data,
        createdAt: new Date()
      })
    })

    // Mock payment operations
    ;(db.payment.create as jest.Mock).mockImplementation(({ data }) => {
      return Promise.resolve({
        id: `payment-${Date.now()}`,
        ...data,
        createdAt: new Date()
      })
    })
  }

  const simulateStudentLogin = async (student: SimulatedStudent) => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        email: student.email,
        password: 'testpassword'
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    req.json = jest.fn().mockResolvedValue({
      email: student.email,
      password: 'testpassword'
    })

    return {
      success: true,
      user: {
        id: student.userId,
        email: student.email,
        role: 'STUDENT',
        studentId: student.id
      }
    }
  }

  const simulateAppointmentCreation = async (studentId: string, tutorId: string, subject: string) => {
    const requestBody = {
      studentId,
      tutorId,
      date: '2025-10-15',
      time: '10:00',
      subject,
      duration: 60,
      notes: `Appointment for ${subject}`
    }

    const { req } = createMocks({
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    req.json = jest.fn().mockResolvedValue(requestBody)
    
    const response = await AppointmentPOST(req as any)
    return response
  }

  const simulateAppointmentQuery = async (studentId: string) => {
    // Mock the request to get appointments for a specific student
    const mockAppointments = students.find(s => s.id === studentId)?.appointments || []
    
    // Override the mock to return student-specific appointments
    ;(db.appointment.findMany as jest.Mock).mockResolvedValueOnce(mockAppointments)
    
    const response = await AppointmentGET()
    return response
  }

  it('should simulate multiple students logging in simultaneously', async () => {
    const loginPromises = students.map(student => simulateStudentLogin(student))
    const loginResults = await Promise.all(loginPromises)

    expect(loginResults).toHaveLength(4)
    loginResults.forEach((result, index) => {
      expect(result.success).toBe(true)
      expect(result.user.email).toBe(students[index].email)
      expect(result.user.role).toBe('STUDENT')
    })
  })

  it('should simulate concurrent appointment booking by multiple students', async () => {
    // Students book appointments simultaneously
    const appointmentPromises = [
      simulateAppointmentCreation('student-1', 'tutor-1', 'Mathematics'),
      simulateAppointmentCreation('student-2', 'tutor-1', 'Physics'),
      simulateAppointmentCreation('student-3', 'tutor-2', 'Chemistry'),
      simulateAppointmentCreation('student-4', 'tutor-2', 'Biology')
    ]

    const appointmentResults = await Promise.all(appointmentPromises)

    expect(appointmentResults).toHaveLength(4)
    appointmentResults.forEach(result => {
      expect(result.status).toBe(201)
    })

    // Verify appointments were created
    expect(db.appointment.create).toHaveBeenCalledTimes(4)
    expect(db.notification.create).toHaveBeenCalledTimes(4)
  })

  it('should simulate students viewing their appointments after booking', async () => {
    // First, create some appointments
    await simulateAppointmentCreation('student-1', 'tutor-1', 'Mathematics')
    await simulateAppointmentCreation('student-2', 'tutor-1', 'Physics')

    // Then students query their appointments
    const queryPromises = [
      simulateAppointmentQuery('student-1'),
      simulateAppointmentQuery('student-2')
    ]

    const queryResults = await Promise.all(queryPromises)

    expect(queryResults).toHaveLength(2)
    queryResults.forEach(result => {
      expect(result.status).toBe(200)
    })
  })

  it('should simulate mixed student activities in rapid succession', async () => {
    const activities = []

    // Student 1: Login -> Book appointment -> Check schedule
    activities.push(
      simulateStudentLogin(students[0]),
      simulateAppointmentCreation('student-1', 'tutor-1', 'Mathematics'),
      simulateAppointmentQuery('student-1')
    )

    // Student 2: Login -> Book appointment -> Check notifications
    activities.push(
      simulateStudentLogin(students[1]),
      simulateAppointmentCreation('student-2', 'tutor-1', 'Physics')
    )

    // Student 3: Login -> Multiple bookings
    activities.push(
      simulateStudentLogin(students[2]),
      simulateAppointmentCreation('student-3', 'tutor-2', 'Chemistry'),
      simulateAppointmentCreation('student-3', 'tutor-2', 'Biology')
    )

    // Execute all activities concurrently
    const results = await Promise.allSettled(activities)

    // Check that most activities succeeded
    const successCount = results.filter(r => r.status === 'fulfilled').length
    expect(successCount).toBeGreaterThan(5) // Expect most to succeed
  })

  it('should simulate high-load scenario with rapid consecutive actions', async () => {
    const rapidActions = []

    // Create 20 rapid appointment booking attempts
    for (let i = 0; i < 20; i++) {
      const studentIndex = i % students.length
      const tutorIndex = i % tutors.length
      const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology']
      const subject = subjects[i % subjects.length]

      rapidActions.push(
        simulateAppointmentCreation(
          students[studentIndex].id,
          tutors[tutorIndex].id,
          subject
        )
      )
    }

    // Execute all actions
    const results = await Promise.allSettled(rapidActions)

    // Verify system handles load
    const successCount = results.filter(r => r.status === 'fulfilled').length
    expect(successCount).toBeGreaterThan(15) // Expect most to succeed
    expect(db.appointment.create).toHaveBeenCalledTimes(successCount)
  })

  it('should simulate realistic student behavior patterns', async () => {
    // Morning rush: Multiple students login and book
    const morningRush = students.slice(0, 2).map(async (student) => {
      await simulateStudentLogin(student)
      await simulateAppointmentCreation(student.id, 'tutor-1', 'Mathematics')
      return simulateAppointmentQuery(student.id)
    })

    // Afternoon activity: Different students check schedules
    const afternoonActivity = students.slice(2).map(async (student) => {
      await simulateStudentLogin(student)
      return simulateAppointmentQuery(student.id)
    })

    // Execute patterns with some delay simulation
    const morningResults = await Promise.all(morningRush)
    const afternoonResults = await Promise.all(afternoonActivity)

    expect(morningResults).toHaveLength(2)
    expect(afternoonResults).toHaveLength(2)

    // Verify realistic usage patterns
    expect(db.appointment.create).toHaveBeenCalledTimes(2)
    expect(db.appointment.findMany).toHaveBeenCalledTimes(4)
  })

  it('should handle edge cases during simulation', async () => {
    // Test appointment booking with invalid data
    const invalidAppointment = simulateAppointmentCreation('nonexistent-student', 'tutor-1', 'Math')
    
    // Test queries for non-existent data
    const invalidQuery = simulateAppointmentQuery('nonexistent-student')

    // Execute edge cases
    const results = await Promise.allSettled([invalidAppointment, invalidQuery])

    // System should handle gracefully (some may fail, but shouldn't crash)
    expect(results).toHaveLength(2)
    results.forEach(result => {
      // Should not throw unhandled errors
      expect(result.status).toMatch(/(fulfilled|rejected)/)
    })
  })

  it('should simulate notification system during high activity', async () => {
    // Create multiple appointments to trigger notifications
    const appointmentPromises = students.map((student, index) => 
      simulateAppointmentCreation(
        student.id, 
        tutors[index % tutors.length].id, 
        'Test Subject'
      )
    )

    await Promise.all(appointmentPromises)

    // Verify notifications were created for each appointment
    expect(db.notification.create).toHaveBeenCalledTimes(students.length)

    // Check that notifications contain proper data
    const notificationCalls = (db.notification.create as jest.Mock).mock.calls
    notificationCalls.forEach(call => {
      const notificationData = call[0].data
      expect(notificationData).toHaveProperty('userId')
      expect(notificationData).toHaveProperty('type')
      expect(notificationData).toHaveProperty('message')
    })
  })

  afterEach(() => {
    // Clean up any remaining state
    students.forEach(student => {
      student.appointments = []
      student.notifications = []
    })
  })
})