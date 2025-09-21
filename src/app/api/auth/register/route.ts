import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { UserRepository } from '../../../../lib/repositories/user.repository'
import { StudentRepository } from '../../../../lib/repositories/student.repository'
import { TutorRepository } from '../../../../lib/repositories/tutor.repository'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['STUDENT', 'TUTOR'], {
    errorMap: () => ({ message: 'Role must be either STUDENT or TUTOR' }),
  }),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  // Student specific fields
  gradeLevel: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  learningGoals: z.string().optional(),
  parentContact: z.string().optional(),
  // Tutor specific fields
  specializations: z.array(z.string()).optional(),
  experienceYears: z.number().min(0).optional(),
  education: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  bio: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  languages: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const userRepository = new UserRepository()
    const studentRepository = new StudentRepository()
    const tutorRepository = new TutorRepository()

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(validatedData.email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create user
    const user = await userRepository.create({
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: validatedData.role,
      phone: validatedData.phone,
      timezone: validatedData.timezone || 'UTC',
    })

    // Create role-specific profile
    if (validatedData.role === 'STUDENT') {
      await studentRepository.create({
        userId: user.id,
        gradeLevel: validatedData.gradeLevel,
        subjects: validatedData.subjects || [],
        learningGoals: validatedData.learningGoals,
        parentContact: validatedData.parentContact,
      })
    } else if (validatedData.role === 'TUTOR') {
      await tutorRepository.create({
        userId: user.id,
        specializations: validatedData.specializations || [],
        experienceYears: validatedData.experienceYears,
        education: validatedData.education,
        certifications: validatedData.certifications || [],
        bio: validatedData.bio,
        hourlyRate: validatedData.hourlyRate,
        languages: validatedData.languages || ['English'],
      })
    }

    // Return user data (without password)
    const { password, ...userWithoutPassword } = user
    
    return NextResponse.json(
      {
        user: userWithoutPassword,
        message: 'Account created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
