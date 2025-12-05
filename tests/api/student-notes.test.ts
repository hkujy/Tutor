import { createMocks } from 'node-mocks-http'
import { db } from '../../src/lib/db/client'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300
    })
  }
}))

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

// Mock auth config
jest.mock('../../src/lib/auth/config', () => ({
  authOptions: {}
}))

// Mock the database
jest.mock('../../src/lib/db/client', () => ({
  db: {
    studentNote: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appointment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}))

import { getServerSession } from 'next-auth/next'

// Import the API functions after mocking
const { GET, POST, PUT, DELETE } = require('../../src/app/api/notes/route')

describe('/api/notes API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/notes', () => {
    it('should fetch notes for a tutor', async () => {
      const mockSession = {
        user: {
          id: 'tutor-1',
          role: 'TUTOR',
          tutorId: 'tutor-1'
        }
      }

      const mockNotes = [
        {
          id: 'note-1',
          title: 'Progress Update',
          content: 'Student is improving in mathematics',
          type: 'PROGRESS_UPDATE',
          priority: 'NORMAL',
          isPrivate: false,
          tags: ['math', 'improvement'],
          sessionDate: '2025-10-15',
          createdAt: '2025-10-10T10:00:00Z',
          updatedAt: '2025-10-10T10:00:00Z',
          student: {
            user: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            }
          },
          tutor: {
            user: {
              firstName: 'Jane',
              lastName: 'Smith'
            }
          }
        }
      ]

      const mockStudentAppointments = [
        { studentId: 'student-1' },
        { studentId: 'student-2' }
      ]

        ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)
        ; (db.appointment.findMany as jest.Mock).mockResolvedValue(mockStudentAppointments)
        ; (db.studentNote.findMany as jest.Mock).mockResolvedValue(mockNotes)

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/notes',
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notes).toEqual(mockNotes)
      expect(db.studentNote.findMany).toHaveBeenCalledWith({
        where: {
          studentId: {
            in: ['student-1', 'student-2']
          }
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          tutor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: undefined,
        skip: undefined,
      })
    })

    it('should fetch notes for a specific student', async () => {
      const mockSession = {
        user: {
          id: 'tutor-1',
          role: 'TUTOR',
          tutorId: 'tutor-1'
        }
      }

      const mockNotes = [
        {
          id: 'note-1',
          title: 'Session Feedback',
          content: 'Great session today',
          type: 'SESSION_FEEDBACK',
          priority: 'HIGH',
          isPrivate: false,
          tags: ['session'],
          student: { user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' } },
          tutor: { user: { firstName: 'Jane', lastName: 'Smith' } }
        }
      ]

        ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)
        ; (db.studentNote.findMany as jest.Mock).mockResolvedValue(mockNotes)

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/notes?studentId=student-1',
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notes).toEqual(mockNotes)
      expect(db.studentNote.findMany).toHaveBeenCalledWith({
        where: {
          studentId: 'student-1'
        },
        include: expect.any(Object),
        orderBy: expect.any(Array),
        take: undefined,
        skip: undefined,
      })
    })

    it('should return 401 for unauthorized users', async () => {
      ; (getServerSession as jest.Mock).mockResolvedValue(null)

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/notes',
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/notes', () => {
    it('should create a new note successfully', async () => {
      const mockSession = {
        user: {
          id: 'tutor-1',
          role: 'TUTOR',
          tutorId: 'tutor-1'
        }
      }

      const noteData = {
        studentId: 'student-1',
        title: 'Great Progress',
        content: 'Student is showing excellent improvement in algebra',
        type: 'PROGRESS_UPDATE',
        priority: 'HIGH',
        isPrivate: false,
        tags: ['algebra', 'improvement'],
        sessionDate: '2025-10-15'
      }

      const mockCreatedNote = {
        id: 'note-1',
        ...noteData,
        tutorId: 'tutor-1',
        sessionDate: new Date('2025-10-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
        student: {
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          }
        },
        tutor: {
          user: {
            firstName: 'Jane',
            lastName: 'Smith'
          }
        }
      }

        ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)
        ; (db.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'appointment-1' })
        ; (db.studentNote.create as jest.Mock).mockResolvedValue(mockCreatedNote)
        ; (db.notification.create as jest.Mock).mockResolvedValue({})

      const { req } = createMocks({
        method: 'POST',
        body: noteData,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      req.json = jest.fn().mockResolvedValue(noteData)

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.note).toEqual(mockCreatedNote)
      expect(db.studentNote.create).toHaveBeenCalledWith({
        data: {
          ...noteData,
          tutorId: 'tutor-1',
          sessionDate: new Date('2025-10-15'),
        },
        include: expect.any(Object)
      })
      expect(db.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'student-1',
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'New high priority note',
          message: 'Your tutor has added a high priority note: Great Progress',
          channels: ['email']
        }
      })
    })

    it('should return 403 if tutor has no access to student', async () => {
      const mockSession = {
        user: {
          id: 'tutor-1',
          role: 'TUTOR',
          tutorId: 'tutor-1'
        }
      }

      const noteData = {
        studentId: 'student-unauthorized',
        title: 'Test Note',
        content: 'Test content',
      }

        ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)
        ; (db.appointment.findFirst as jest.Mock).mockResolvedValue(null)

      const { req } = createMocks({
        method: 'POST',
        body: noteData,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      req.json = jest.fn().mockResolvedValue(noteData)

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('You do not have access to create notes for this student')
    })

    it('should return 401 for non-tutor users', async () => {
      const mockSession = {
        user: {
          id: 'student-1',
          role: 'STUDENT'
        }
      }

        ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const { req } = createMocks({
        method: 'POST',
        body: { title: 'Test', content: 'Test' },
        headers: {
          'Content-Type': 'application/json',
        },
      })

      req.json = jest.fn().mockResolvedValue({ title: 'Test', content: 'Test' })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('PUT /api/notes', () => {
    it('should update a note successfully', async () => {
      const mockSession = {
        user: {
          id: 'tutor-1',
          role: 'TUTOR',
          tutorId: 'tutor-1'
        }
      }

      const updateData = {
        id: 'note-1',
        title: 'Updated Title',
        content: 'Updated content',
        priority: 'URGENT'
      }

      const mockExistingNote = {
        id: 'note-1',
        tutorId: 'tutor-1',
        student: { id: 'student-1' }
      }

      const mockUpdatedNote = {
        ...mockExistingNote,
        ...updateData,
        student: {
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          }
        },
        tutor: {
          user: {
            firstName: 'Jane',
            lastName: 'Smith'
          }
        }
      }

        ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)
        ; (db.studentNote.findUnique as jest.Mock).mockResolvedValue(mockExistingNote)
        ; (db.studentNote.update as jest.Mock).mockResolvedValue(mockUpdatedNote)

      const { req } = createMocks({
        method: 'PUT',
        body: updateData,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      req.json = jest.fn().mockResolvedValue(updateData)

      const response = await PUT(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.note).toEqual(mockUpdatedNote)
      expect(db.studentNote.update).toHaveBeenCalledWith({
        where: { id: 'note-1' },
        data: {
          title: 'Updated Title',
          content: 'Updated content',
          priority: 'URGENT'
        },
        include: expect.any(Object)
      })
    })

    it('should return 404 for non-existent or unauthorized note', async () => {
      const mockSession = {
        user: {
          id: 'tutor-1',
          role: 'TUTOR',
          tutorId: 'tutor-1'
        }
      }

        ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)
        ; (db.studentNote.findUnique as jest.Mock).mockResolvedValue(null)

      const { req } = createMocks({
        method: 'PUT',
        body: { id: 'note-nonexistent', title: 'Test' },
        headers: {
          'Content-Type': 'application/json',
        },
      })

      req.json = jest.fn().mockResolvedValue({ id: 'note-nonexistent', title: 'Test' })

      const response = await PUT(req as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Note not found or unauthorized')
    })
  })

  describe('DELETE /api/notes', () => {
    it('should delete a note successfully', async () => {
      const mockSession = {
        user: {
          id: 'tutor-1',
          role: 'TUTOR',
          tutorId: 'tutor-1'
        }
      }

      const mockExistingNote = {
        id: 'note-1',
        tutorId: 'tutor-1'
      }

        ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)
        ; (db.studentNote.findUnique as jest.Mock).mockResolvedValue(mockExistingNote)
        ; (db.studentNote.delete as jest.Mock).mockResolvedValue({})

      const { req } = createMocks({
        method: 'DELETE',
        url: 'http://localhost:3000/api/notes?id=note-1',
      })

      const response = await DELETE(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(db.studentNote.delete).toHaveBeenCalledWith({
        where: { id: 'note-1' }
      })
    })

    it('should return 400 if note ID is missing', async () => {
      const mockSession = {
        user: {
          id: 'tutor-1',
          role: 'TUTOR',
          tutorId: 'tutor-1'
        }
      }

        ; (getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const { req } = createMocks({
        method: 'DELETE',
        url: 'http://localhost:3000/api/notes',
      })

      const response = await DELETE(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Note ID is required')
    })
  })
})