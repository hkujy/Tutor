import { hash } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    const hashedPassword = await hash('testpassword123', 12)
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
        timezone: 'UTC',
        isActive: true,
        isVerified: true,
      },
    })

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        gradeLevel: '10',
        subjects: ['Math', 'Science'],
        learningGoals: 'Improve in algebra and physics',
      },
    })

    console.log('Test user created successfully:', {
      email: user.email,
      role: user.role,
      studentId: student.id,
    })
  } catch (error) {
    console.error('Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()