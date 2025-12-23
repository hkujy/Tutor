import { db } from '../db/client'
import { isValidId, isValidSpecializations, isValidExperienceYears, isValidHourlyRate, isValidCurrency, isValidLanguages, isValidTextContent } from '../utils/validation'
import { sanitizeString, sanitizeArray } from '../utils/sanitization'
import { handleDatabaseError } from '../utils/database-errors'
import { VALIDATION_LIMITS } from '../utils/constants'

export type CreateTutorInput = {
  userId: string
  specializations: string[]
  experienceYears?: number
  education?: string
  certifications: string[]
  bio?: string
  hourlyRate?: number
  currency?: string
  languages?: string[]
}

export type UpdateTutorInput = Partial<Omit<CreateTutorInput, 'userId'>>

export class TutorRepository {
  async create(data: CreateTutorInput) {
    // Comprehensive input validation
    if (!data.userId || !isValidId(data.userId)) {
      throw new Error('Valid user ID is required')
    }

    if (!data.specializations || !isValidSpecializations(data.specializations)) {
      throw new Error('At least one valid specialization is required')
    }

    if (!isValidExperienceYears(data.experienceYears)) {
      throw new Error('Experience years must be between 0 and 100')
    }

    if (!isValidHourlyRate(data.hourlyRate)) {
      throw new Error('Hourly rate must be between 0 and 10000')
    }

    if (!isValidCurrency(data.currency)) {
      throw new Error('Invalid currency code')
    }

    if (!isValidLanguages(data.languages)) {
      throw new Error('Invalid languages format')
    }

    if (data.education && !isValidTextContent(data.education, VALIDATION_LIMITS.EDUCATION_MAX_LENGTH)) {
      throw new Error('Invalid education format')
    }

    if (data.bio && !isValidTextContent(data.bio, VALIDATION_LIMITS.BIO_MAX_LENGTH)) {
      throw new Error('Invalid bio format')
    }

    try {
      const sanitizedData = {
        userId: data.userId,
        specializations: sanitizeArray(data.specializations),
        experienceYears: data.experienceYears,
        education: data.education ? sanitizeString(data.education) : null,
        certifications: sanitizeArray(data.certifications || []),
        bio: data.bio ? sanitizeString(data.bio) : null,
        hourlyRate: data.hourlyRate,
        currency: data.currency || 'USD',
        languages: data.languages ? sanitizeArray(data.languages) : ['English'],
      }

      return await db.tutor.create({
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
          availability: true,
          appointments: {
            orderBy: { startTime: 'desc' },
            take: 5,
          },
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'create tutor', 'tutor')
    }
  }

  async findById(id: string) {
    if (!id || !isValidId(id)) {
      throw new Error('Valid tutor ID is required')
    }

    try {
      return await db.tutor.findUnique({
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
          availability: {
            where: { isActive: true },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
          },
          availabilityExceptions: {
            where: {
              date: {
                gte: new Date(),
              },
            },
            orderBy: { date: 'asc' },
          },
          appointments: {
            orderBy: { startTime: 'desc' },
            include: {
              student: {
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
      handleDatabaseError(error, 'find tutor by ID', 'tutor')
    }
  }

  async findByUserId(userId: string) {
    if (!userId || !isValidId(userId)) {
      throw new Error('Valid user ID is required')
    }

    try {
      return await db.tutor.findUnique({
        where: { userId },
        include: {
          user: true,
          availability: true,
          appointments: {
            orderBy: { startTime: 'desc' },
            take: 5,
          },
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'find tutor by user ID', 'tutor')
    }
  }

  async update(id: string, data: UpdateTutorInput) {
    if (!id || !isValidId(id)) {
      throw new Error('Valid tutor ID is required')
    }

    // Validate individual fields
    if (data.specializations && !isValidSpecializations(data.specializations)) {
      throw new Error('Valid specializations are required')
    }

    if (!isValidExperienceYears(data.experienceYears)) {
      throw new Error('Experience years must be between 0 and 100')
    }

    if (!isValidHourlyRate(data.hourlyRate)) {
      throw new Error('Hourly rate must be between 0 and 10000')
    }

    if (!isValidCurrency(data.currency)) {
      throw new Error('Invalid currency code')
    }

    if (!isValidLanguages(data.languages)) {
      throw new Error('Invalid languages format')
    }

    if (data.education && !isValidTextContent(data.education, VALIDATION_LIMITS.EDUCATION_MAX_LENGTH)) {
      throw new Error('Invalid education format')
    }

    if (data.bio && !isValidTextContent(data.bio, VALIDATION_LIMITS.BIO_MAX_LENGTH)) {
      throw new Error('Invalid bio format')
    }

    try {
      const updateData: any = {}

      if (data.specializations) {
        updateData.specializations = sanitizeArray(data.specializations)
      }

      if (data.experienceYears !== undefined) {
        updateData.experienceYears = data.experienceYears
      }

      if (data.education !== undefined) {
        updateData.education = data.education ? sanitizeString(data.education) : null
      }

      if (data.certifications) {
        updateData.certifications = sanitizeArray(data.certifications)
      }

      if (data.bio !== undefined) {
        updateData.bio = data.bio ? sanitizeString(data.bio) : null
      }

      if (data.hourlyRate !== undefined) {
        updateData.hourlyRate = data.hourlyRate
      }

      if (data.currency) {
        updateData.currency = data.currency
      }

      if (data.languages) {
        updateData.languages = sanitizeArray(data.languages)
      }

      return await db.tutor.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          availability: true,
          appointments: {
            orderBy: { startTime: 'desc' },
            take: 5,
          },
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'update tutor', 'tutor')
    }
  }

  async delete(id: string) {
    if (!id || !isValidId(id)) {
      throw new Error('Valid tutor ID is required')
    }

    try {
      return await db.tutor.delete({
        where: { id },
      })
    } catch (error) {
      handleDatabaseError(error, 'delete tutor', 'tutor')
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

      return await db.tutor.findMany({
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
      handleDatabaseError(error, 'find many tutors', 'tutor')
    }
  }

  async count(where?: any) {
    try {
      return await db.tutor.count({ where })
    } catch (error) {
      handleDatabaseError(error, 'count tutors', 'tutor')
    }
  }

  async searchTutors(params: {
    subjects?: string[]
    languages?: string[]
    minRating?: number
    maxHourlyRate?: number
    availableOn?: Date
    skip?: number
    take?: number
  }) {
    const where: any = {
      verified: true,
      user: {
        isActive: true,
        isVerified: true,
      },
    }

    if (params.subjects && params.subjects.length > 0) {
      where.specializations = {
        hasSome: params.subjects,
      }
    }

    if (params.languages && params.languages.length > 0) {
      where.languages = {
        hasSome: params.languages,
      }
    }

    if (params.minRating) {
      where.rating = {
        gte: params.minRating,
      }
    }

    if (params.maxHourlyRate) {
      where.hourlyRate = {
        lte: params.maxHourlyRate,
      }
    }

    return db.tutor.findMany({
      where,
      skip: params.skip,
      take: params.take || 20,
      orderBy: [{ rating: 'desc' }, { totalSessions: 'desc' }],
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            timezone: true,
          },
        },
        availability: {
          where: { isActive: true },
        },
      },
    })
  }

  async getUpcomingAppointments(tutorId: string, limit = 5) {
    return db.appointment.findMany({
      where: {
        tutorId,
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
        student: {
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
  }

  async updateRating(tutorId: string, newRating: number) {
    return db.tutor.update({
      where: { id: tutorId },
      data: { rating: newRating },
    })
  }

  async incrementSessions(tutorId: string) {
    return db.tutor.update({
      where: { id: tutorId },
      data: {
        totalSessions: {
          increment: 1,
        },
      },
    })
  }
}
