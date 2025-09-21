import { db } from '../db/client'
import { hash } from 'bcryptjs'

export type CreateUserInput = {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'STUDENT' | 'TUTOR' | 'ADMIN'
  phone?: string
  timezone?: string
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'password'>> & {
  password?: string
  isActive?: boolean
  isVerified?: boolean
  avatar?: string
}

export class UserRepository {
  async create(data: CreateUserInput) {
    const hashedPassword = await hash(data.password, 12)

    return db.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        timezone: data.timezone || 'UTC',
      },
      include: {
        student: true,
        tutor: true,
      },
    })
  }

  async findById(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        student: true,
        tutor: true,
        notifications: {
          where: { readAt: null },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        notificationPreference: true,
      },
    })
  }

  async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        student: true,
        tutor: true,
      },
    })
  }

  async update(id: string, data: UpdateUserInput) {
    const updateData: any = { ...data }
    
    if (data.password) {
      updateData.password = await hash(data.password, 12)
    }
    
    if (data.email) {
      updateData.email = data.email.toLowerCase()
    }

    return db.user.update({
      where: { id },
      data: updateData,
      include: {
        student: true,
        tutor: true,
      },
    })
  }

  async delete(id: string) {
    return db.user.delete({
      where: { id },
    })
  }

  async findMany(params: {
    skip?: number
    take?: number
    where?: any
    orderBy?: any
  }) {
    return db.user.findMany({
      ...params,
      include: {
        student: true,
        tutor: true,
      },
    })
  }

  async count(where?: any) {
    return db.user.count({ where })
  }

  async updateLastLogin(id: string) {
    return db.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    })
  }

  async verifyUser(id: string) {
    return db.user.update({
      where: { id },
      data: { isVerified: true },
    })
  }
}
