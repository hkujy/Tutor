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
  phone: z.string().nullish(),
  timezone: z.string().nullish(),
  // Student specific fields
  gradeLevel: z.string().nullish(),
  subjects: z.array(z.string()).nullish(),
  learningGoals: z.string().nullish(),
  parentContact: z.string().nullish(),
  // Tutor specific fields
  specializations: z.array(z.string()).nullish(),
  experienceYears: z.number().min(0).nullish(),
  education: z.string().nullish(),
  certifications: z.array(z.string()).nullish(),
  bio: z.string().nullish(),
  hourlyRate: z.number().min(0).nullish(),
  languages: z.array(z.string()).nullish(),
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
      phone: validatedData.phone || undefined,
      timezone: validatedData.timezone || undefined,
    })

    // Create role-specific profile
    if (user && validatedData.role === 'STUDENT') {
      await studentRepository.create({
        userId: user.id,
        gradeLevel: validatedData.gradeLevel || undefined,
        subjects: validatedData.subjects || [],
        learningGoals: validatedData.learningGoals || undefined,
        parentContact: validatedData.parentContact || undefined,
      })
    } else if (user && validatedData.role === 'TUTOR') {
      await tutorRepository.create({
        userId: user.id,
        specializations: validatedData.specializations || [],
        experienceYears: validatedData.experienceYears || undefined,
        education: validatedData.education || undefined,
        certifications: validatedData.certifications || [],
        bio: validatedData.bio || undefined,
        hourlyRate: validatedData.hourlyRate || undefined,
        languages: validatedData.languages || ['English'],
      })
    }

    if (!user) {
      throw new Error('Failed to create user')
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
