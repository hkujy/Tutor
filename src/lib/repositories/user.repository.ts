import { db } from '../db/client'
import { hash } from 'bcryptjs'
import { Prisma } from '@prisma/client'

// Input validation and sanitization functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && password.length <= 128
}

const isValidName = (name: string): boolean => {
  return name.trim().length > 0 && name.length <= 100 && !/[<>"'&]/.test(name)
}

const isValidRole = (role: string): role is 'STUDENT' | 'TUTOR' | 'ADMIN' => {
  return ['STUDENT', 'TUTOR', 'ADMIN'].includes(role)
}

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>"'&]/g, '')
}

const handleDatabaseError = (error: any, operation: string): never => {
  console.error(`Database error in ${operation}:`, error)
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new Error('A user with this email already exists')
      case 'P2025':
        throw new Error('User not found')
      case 'P2003':
        throw new Error('Invalid reference to related data')
      default:
        throw new Error(`Database operation failed: ${error.message}`)
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new Error('Invalid data provided')
  }
  
  throw new Error('An unexpected database error occurred')
}

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
    
    if (data.phone && (data.phone.length > 20 || !/^[+\d\s\-()]+$/.test(data.phone))) {
      throw new Error('Invalid phone number format')
    }
    
    try {
      const hashedPassword = await hash(data.password, 12)
      
      const sanitizedData = {
        email: data.email.toLowerCase().trim(),
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
      handleDatabaseError(error, 'create user')
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
      handleDatabaseError(error, 'find user by ID')
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
      handleDatabaseError(error, 'find user by email')
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
    
    if (data.phone && data.phone.length > 0 && !/^[+\d\s\-()]+$/.test(data.phone)) {
      throw new Error('Invalid phone number format')
    }
    
    try {
      const updateData: any = {}
      
      if (data.email) {
        updateData.email = data.email.toLowerCase().trim()
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
      handleDatabaseError(error, 'update user')
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
