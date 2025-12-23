import { db } from '../db/client'
import { isValidId, isValidSubjects, isValidGradeLevel, isValidEmail, isValidTextContent } from '../utils/validation'
import { sanitizeString, sanitizeArray, sanitizeEmail } from '../utils/sanitization'
import { handleDatabaseError } from '../utils/database-errors'
import { VALIDATION_LIMITS } from '../utils/constants'

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

    if (data.learningGoals && !isValidTextContent(data.learningGoals, VALIDATION_LIMITS.LEARNING_GOALS_MAX_LENGTH)) {
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
        parentContact: data.parentContact ? sanitizeEmail(data.parentContact) : null,
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
      handleDatabaseError(error, 'create student', 'student')
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
      handleDatabaseError(error, 'find student by ID', 'student')
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
      handleDatabaseError(error, 'find student by user ID', 'student')
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

    if (data.learningGoals && !isValidTextContent(data.learningGoals, VALIDATION_LIMITS.LEARNING_GOALS_MAX_LENGTH)) {
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
        updateData.parentContact = data.parentContact ? sanitizeEmail(data.parentContact) : null
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
      handleDatabaseError(error, 'update student', 'student')
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
      handleDatabaseError(error, 'delete student', 'student')
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

      if (params.take !== undefined && (!Number.isInteger(params.take) || params.take < VALIDATION_LIMITS.PAGINATION_MIN_TAKE || params.take > VALIDATION_LIMITS.PAGINATION_MAX_TAKE)) {
        throw new Error(`Take must be between ${VALIDATION_LIMITS.PAGINATION_MIN_TAKE} and ${VALIDATION_LIMITS.PAGINATION_MAX_TAKE}`)
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
      handleDatabaseError(error, 'find many students', 'student')
    }
  }

  async count(where?: any) {
    try {
      return await db.student.count({ where })
    } catch (error) {
      handleDatabaseError(error, 'count students', 'student')
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
      handleDatabaseError(error, 'get upcoming appointments', 'student')
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
      handleDatabaseError(error, 'get pending assignments', 'student')
    }
  }
}
