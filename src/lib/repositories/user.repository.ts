import { db } from '../db/client'
import { hash } from 'bcryptjs'
import { isValidEmail, isValidPassword, isValidName, isValidRole, isValidUUID, isValidPhone } from '../utils/validation'
import { sanitizeString, sanitizeEmail } from '../utils/sanitization'
import { handleDatabaseError } from '../utils/database-errors'
import type { Role } from '../utils/constants'

export type CreateUserInput = {
  email: string
  password: string
  firstName: string
  lastName: string
  role: Role
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
    // Comprehensive input validation
    if (!data.email || !isValidEmail(data.email)) {
      throw new Error('Valid email is required')
    }

    if (!data.password || !isValidPassword(data.password)) {
      throw new Error('Password must be between 8 and 128 characters')
    }

    if (!data.firstName || !isValidName(data.firstName)) {
      throw new Error('Valid first name is required')
    }

    if (!data.lastName || !isValidName(data.lastName)) {
      throw new Error('Valid last name is required')
    }

    if (!data.role || !isValidRole(data.role)) {
      throw new Error('Valid role is required')
    }

    if (data.phone && !isValidPhone(data.phone)) {
      throw new Error('Invalid phone number format')
    }

    try {
      const hashedPassword = await hash(data.password, 12)

      const sanitizedData = {
        email: sanitizeEmail(data.email),
        password: hashedPassword,
        firstName: sanitizeString(data.firstName),
        lastName: sanitizeString(data.lastName),
        role: data.role,
        phone: data.phone ? sanitizeString(data.phone) : null,
        timezone: data.timezone || 'UTC',
      }

      return await db.user.create({
        data: sanitizedData,
        include: {
          student: true,
          tutor: true,
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'create user', 'user')
    }
  }

  async findById(id: string) {
    if (!id || !isValidUUID(id)) {
      throw new Error('Valid user ID is required')
    }

    try {
      return await db.user.findUnique({
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
    } catch (error) {
      handleDatabaseError(error, 'find user by ID', 'user')
    }
  }

  async findByEmail(email: string) {
    if (!email || !isValidEmail(email)) {
      throw new Error('Valid email is required')
    }

    try {
      return await db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          student: true,
          tutor: true,
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'find user by email', 'user')
    }
  }

  async update(id: string, data: UpdateUserInput) {
    if (!id || !isValidUUID(id)) {
      throw new Error('Valid user ID is required')
    }

    // Validate individual fields
    if (data.email && !isValidEmail(data.email)) {
      throw new Error('Valid email is required')
    }

    if (data.password && !isValidPassword(data.password)) {
      throw new Error('Password must be between 8 and 128 characters')
    }

    if (data.firstName && !isValidName(data.firstName)) {
      throw new Error('Valid first name is required')
    }

    if (data.lastName && !isValidName(data.lastName)) {
      throw new Error('Valid last name is required')
    }

    if (data.phone && data.phone.length > 0 && !isValidPhone(data.phone)) {
      throw new Error('Invalid phone number format')
    }

    try {
      const updateData: any = {}

      if (data.email) {
        updateData.email = sanitizeEmail(data.email)
      }

      if (data.password) {
        updateData.password = await hash(data.password, 12)
      }

      if (data.firstName) {
        updateData.firstName = sanitizeString(data.firstName)
      }

      if (data.lastName) {
        updateData.lastName = sanitizeString(data.lastName)
      }

      if (data.phone !== undefined) {
        updateData.phone = data.phone ? sanitizeString(data.phone) : null
      }

      // Only include defined boolean values
      if (typeof data.isActive === 'boolean') {
        updateData.isActive = data.isActive
      }

      if (typeof data.isVerified === 'boolean') {
        updateData.isVerified = data.isVerified
      }

      if (data.timezone) {
        updateData.timezone = data.timezone
      }

      if (data.avatar) {
        updateData.avatar = sanitizeString(data.avatar)
      }

      return await db.user.update({
        where: { id },
        data: updateData,
        include: {
          student: true,
          tutor: true,
        },
      })
    } catch (error) {
      handleDatabaseError(error, 'update user', 'user')
    }
  }

  async delete(id: string) {
    return db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
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
      where: {
        ...params.where,
        deletedAt: null,
      },
      include: {
        student: true,
        tutor: true,
      },
    })
  }

  async count(where?: any) {
    return db.user.count({
      where: {
        ...where,
        deletedAt: null,
      }
    })
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
