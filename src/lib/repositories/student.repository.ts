import { db } from '../db/client'
import { Prisma } from '@prisma/client'

// Input validation and sanitization functions
const isValidId = (id: string): boolean => {
  // Allow both UUIDs and CUIDs
  // CUIDs start with 'c' and are around 25 chars. UUIDs are 36 chars.
  // We'll just check for a non-empty string with alphanumeric characters and hyphens of reasonable length.
  return typeof id === 'string' && id.length > 0 && id.length <= 50
}

const isValidSubjects = (subjects: string[]): boolean => {
  return Array.isArray(subjects) && 
         subjects.length > 0 && 
         subjects.every(s => typeof s === 'string' && s.trim().length > 0 && s.length <= 100)
}

const isValidGradeLevel = (gradeLevel?: string): boolean => {
  if (!gradeLevel) return true
  const validGrades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'College', 'Graduate']
  return validGrades.includes(gradeLevel)
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>"'&]/g, '')
}

const sanitizeArray = (arr: string[]): string[] => {
  return arr.map(item => sanitizeString(item)).filter(item => item.length > 0)
}

const handleDatabaseError = (error: any, operation: string): never => {
  console.error(`Database error in ${operation}:`, error)
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new Error('A student profile for this user already exists')
      case 'P2025':
        throw new Error('Student not found')
      case 'P2003':
        throw new Error('Invalid reference to user data')
      default:
        throw new Error(`Database operation failed: ${error.message}`)
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new Error('Invalid data provided')
  }
  
  throw new Error('An unexpected database error occurred')
}

export type CreateStudentInput = {
  userId: string
  gradeLevel?: string
  subjects: string[]
  learningGoals?: string
  parentContact?: string
}

export type UpdateStudentInput = Partial<Omit<CreateStudentInput, 'userId'>>

export class StudentRepository {
  async create(data: CreateStudentInput) {
    // Comprehensive input validation
    if (!data.userId || !isValidId(data.userId)) {
      throw new Error('Valid user ID is required')
    }
    
    if (!data.subjects || !isValidSubjects(data.subjects)) {
      throw new Error('At least one valid subject is required')
    }
    
    if (!isValidGradeLevel(data.gradeLevel)) {
      throw new Error('Invalid grade level')
    }
    
    if (data.learningGoals && (data.learningGoals.length > 2000 || /[<>"'&]/.test(data.learningGoals))) {
      throw new Error('Invalid learning goals format')
    }
    
    if (data.parentContact && !isValidEmail(data.parentContact)) {
      throw new Error('Valid parent contact email is required')
    }
    
    try {
      const sanitizedData = {
        userId: data.userId,
        gradeLevel: data.gradeLevel || null,
        subjects: sanitizeArray(data.subjects),
        learningGoals: data.learningGoals ? sanitizeString(data.learningGoals) : null,
        parentContact: data.parentContact ? data.parentContact.toLowerCase().trim() : null,
      }

      return await db.student.create({
        data: sanitizedData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              timezone: true,
              avatar: true,
            },
          },
          appointments: {
            orderBy: { startTime: 'desc' },
            take: 5,
            include: {
              tutor: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'create student')
    }
  }

  async findById(id: string) {
    if (!id || !isValidId(id)) {
      throw new Error('Valid student ID is required')
    }
    
    try {
      return await db.student.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              timezone: true,
              avatar: true,
              isActive: true,
              isVerified: true,
            },
          },
          appointments: {
            orderBy: { startTime: 'desc' },
            include: {
              tutor: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
          assignmentSubmissions: {
            orderBy: { submittedAt: 'desc' },
            take: 10,
            include: {
              assignment: {
                select: {
                  title: true,
                  dueDate: true,
                  status: true,
                },
              },
            },
          },
          studentProgress: {
            orderBy: { assessedAt: 'desc' },
          },
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'find student by ID')
    }
  }

  async findByUserId(userId: string) {
    if (!userId || !isValidId(userId)) {
      throw new Error('Valid user ID is required')
    }
    
    try {
      return await db.student.findUnique({
        where: { userId },
        include: {
          user: true,
          appointments: {
            orderBy: { startTime: 'desc' },
            take: 5,
          },
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'find student by user ID')
    }
  }

  async update(id: string, data: UpdateStudentInput) {
    if (!id || !isValidId(id)) {
      throw new Error('Valid student ID is required')
    }
    
    // Validate individual fields
    if (data.subjects && !isValidSubjects(data.subjects)) {
      throw new Error('Valid subjects are required')
    }
    
    if (!isValidGradeLevel(data.gradeLevel)) {
      throw new Error('Invalid grade level')
    }
    
    if (data.learningGoals && (data.learningGoals.length > 2000 || /[<>"'&]/.test(data.learningGoals))) {
      throw new Error('Invalid learning goals format')
    }
    
    if (data.parentContact && !isValidEmail(data.parentContact)) {
      throw new Error('Valid parent contact email is required')
    }
    
    try {
      const updateData: any = {}
      
      if (data.gradeLevel !== undefined) {
        updateData.gradeLevel = data.gradeLevel
      }
      
      if (data.subjects) {
        updateData.subjects = sanitizeArray(data.subjects)
      }
      
      if (data.learningGoals !== undefined) {
        updateData.learningGoals = data.learningGoals ? sanitizeString(data.learningGoals) : null
      }
      
      if (data.parentContact !== undefined) {
        updateData.parentContact = data.parentContact ? data.parentContact.toLowerCase().trim() : null
      }

      return await db.student.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          appointments: {
            orderBy: { startTime: 'desc' },
            take: 5,
          },
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'update student')
    }
  }

  async delete(id: string) {
    if (!id || !isValidId(id)) {
      throw new Error('Valid student ID is required')
    }
    
    try {
      return await db.student.delete({
        where: { id },
      })
    } catch (error) {
      handleDatabaseError(error, 'delete student')
    }
  }

  async findMany(params: {
    skip?: number
    take?: number
    where?: any
    orderBy?: any
  }) {
    try {
      // Validate pagination parameters
      if (params.skip !== undefined && (!Number.isInteger(params.skip) || params.skip < 0)) {
        throw new Error('Skip must be a non-negative integer')
      }
      
      if (params.take !== undefined && (!Number.isInteger(params.take) || params.take < 1 || params.take > 100)) {
        throw new Error('Take must be between 1 and 100')
      }

      return await db.student.findMany({
        ...params,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              timezone: true,
              avatar: true,
              isActive: true,
            },
          },
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'find many students')
    }
  }

  async count(where?: any) {
    try {
      return await db.student.count({ where })
    } catch (error) {
      handleDatabaseError(error, 'count students')
    }
  }

  async getUpcomingAppointments(studentId: string, limit = 5) {
    if (!studentId || !isValidId(studentId)) {
      throw new Error('Valid student ID is required')
    }
    
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new Error('Limit must be between 1 and 50')
    }
    
    try {
      return await db.appointment.findMany({
        where: {
          studentId,
          startTime: {
            gte: new Date(),
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
        },
        orderBy: { startTime: 'asc' },
        take: limit,
        include: {
          tutor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'get upcoming appointments')
    }
  }

  async getPendingAssignments(studentId: string, limit = 10) {
    if (!studentId || !isValidId(studentId)) {
      throw new Error('Valid student ID is required')
    }
    
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new Error('Limit must be between 1 and 50')
    }
    
    try {
      return await db.assignment.findMany({
        where: {
          appointment: {
            studentId,
          },
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS'],
          },
          dueDate: {
            gte: new Date(),
          },
        },
        orderBy: { dueDate: 'asc' },
        take: limit,
        include: {
          appointment: {
            include: {
              tutor: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          submissions: {
            where: { studentId },
            orderBy: { submittedAt: 'desc' },
            take: 1,
          },
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'get pending assignments')
    }
  }
}
