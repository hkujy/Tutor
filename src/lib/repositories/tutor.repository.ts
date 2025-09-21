import { db } from '../db/client'

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
    return db.tutor.create({
      data: {
        ...data,
        currency: data.currency || 'USD',
        languages: data.languages || ['English'],
      },
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
  }

  async findById(id: string) {
    return db.tutor.findUnique({
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
  }

  async findByUserId(userId: string) {
    return db.tutor.findUnique({
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
  }

  async update(id: string, data: UpdateTutorInput) {
    return db.tutor.update({
      where: { id },
      data,
      include: {
        user: true,
        availability: true,
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 5,
        },
      },
    })
  }

  async delete(id: string) {
    return db.tutor.delete({
      where: { id },
    })
  }

  async findMany(params: {
    skip?: number
    take?: number
    where?: any
    orderBy?: any
  }) {
    return db.tutor.findMany({
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
  }

  async count(where?: any) {
    return db.tutor.count({ where })
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
