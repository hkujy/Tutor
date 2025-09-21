import { db } from '../db/client'

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
    return db.student.create({
      data,
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
  }

  async findById(id: string) {
    return db.student.findUnique({
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
  }

  async findByUserId(userId: string) {
    return db.student.findUnique({
      where: { userId },
      include: {
        user: true,
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 5,
        },
      },
    })
  }

  async update(id: string, data: UpdateStudentInput) {
    return db.student.update({
      where: { id },
      data,
      include: {
        user: true,
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 5,
        },
      },
    })
  }

  async delete(id: string) {
    return db.student.delete({
      where: { id },
    })
  }

  async findMany(params: {
    skip?: number
    take?: number
    where?: any
    orderBy?: any
  }) {
    return db.student.findMany({
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
    return db.student.count({ where })
  }

  async getUpcomingAppointments(studentId: string, limit = 5) {
    return db.appointment.findMany({
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
  }

  async getPendingAssignments(studentId: string, limit = 10) {
    return db.assignment.findMany({
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
  }
}
