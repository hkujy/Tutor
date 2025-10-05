const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Set environment variables
process.env.DATABASE_URL = "postgresql://tutoring:password@localhost:5433/tutoring_calendar_dev"
process.env.DIRECT_URL = "postgresql://tutoring:password@localhost:5433/tutoring_calendar_dev"

const prisma = new PrismaClient()

async function createTutorUser() {
  try {
    console.log('Creating tutor user...')
    
    // Create tutor user
    const tutorUser = await prisma.user.create({
      data: {
        email: 'tutor@example.com',
        password: await bcrypt.hash('tutor123', 12),
        role: 'TUTOR',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '+1-555-0123',
        timezone: 'America/New_York',
        isActive: true,
        isVerified: true,
      },
    })

    console.log('Created tutor user:', tutorUser.email)

    // Create tutor profile
    const tutorProfile = await prisma.tutor.create({
      data: {
        userId: tutorUser.id,
        specializations: ['Mathematics', 'Physics', 'Chemistry'],
        experienceYears: 5,
        hourlyRate: 50.00,
        bio: 'Experienced math and science tutor with 5 years of teaching experience.',
        education: 'M.S. in Mathematics from Stanford University',
        certifications: ['Certified Math Teacher', 'Physics Teaching Certificate'],
        rating: 4.8,
        totalSessions: 120,
        isAvailable: true,
      },
    })

    console.log('Created tutor profile for:', tutorProfile.userId)
    
  } catch (error) {
    console.error('Error creating tutor:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTutorUser()