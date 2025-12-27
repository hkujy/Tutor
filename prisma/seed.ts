import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding... (this might take a moment)')

  // Clear existing data first - fresh start each time
  console.log('🧹 Cleaning up existing data...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tutoringcalendar.com' },
    update: {},
    create: {
      email: 'admin@tutoringcalendar.com',
      password: await hash('admin123', 12),
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      timezone: 'America/New_York',
      isActive: true,
      isVerified: true,
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create sample tutor
  const tutorUser = await prisma.user.upsert({
    where: { email: 'tutor@example.com' },
    update: {},
    create: {
      email: 'tutor@example.com',
      password: await hash('tutor123', 12),
      role: 'TUTOR',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1-555-0123',
      timezone: 'America/New_York',
      isActive: true,
      isVerified: true,
    },
  })

  const tutorProfile = await prisma.tutor.upsert({
    where: { userId: tutorUser.id },
    update: {},
    create: {
      userId: tutorUser.id,
      specializations: ['Mathematics', 'English', 'Music'],
      experienceYears: 5,
      education: 'MS in Mathematics, MIT',
      certifications: ['Certified Math Teacher'],
      bio: 'Experienced mathematics tutor with 5+ years of teaching experience.',
      hourlyRate: 50.0,
      currency: 'USD',
      rating: 4.8,
      totalSessions: 150,
      languages: ['English', 'Spanish'],
      verified: true,
      backgroundCheck: true,
    },
  })

  console.log('✅ Created tutor profile for:', tutorUser.email)

  // Create sample student
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: await hash('student123', 12),
      role: 'STUDENT',
      firstName: 'Alex',
      lastName: 'Smith',
      phone: '+1-555-0456',
      timezone: 'America/New_York',
      isActive: true,
      isVerified: true,
    },
  })

  const studentProfile = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      gradeLevel: '12',
      subjects: ['Music'],
      learningGoals:
        'Improve calculus understanding and prepare for college entrance exams',
      parentContact: 'parent@example.com',
    },
  })

  // --- Additional Realistic Test Users ---
  const realisticTutors = [
    { email: 'sarah.chen@tutortest.com', firstName: 'Sarah', lastName: 'Chen', bio: 'Expert Math Tutor', subjects: ['Mathematics', 'Physics'] },
    { email: 'raj.patel@tutortest.com', firstName: 'Raj', lastName: 'Patel', bio: 'Chemistry & Biology Specialist', subjects: ['Chemistry', 'Biology'] },
    { email: 'maria.rodriguez@tutortest.com', firstName: 'Maria', lastName: 'Rodriguez', bio: 'Spanish Language Expert', subjects: ['Spanish', 'History'] },
  ]

  for (const t of realisticTutors) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        password: await hash('TutorTest123!', 12),
        role: 'TUTOR',
        firstName: t.firstName,
        lastName: t.lastName,
        isActive: true,
        isVerified: true,
      }
    })

    await prisma.tutor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specializations: t.subjects,
        bio: t.bio,
        experienceYears: 10,
        hourlyRate: 60.0,
        verified: true,
      }
    })
  }

  const realisticStudents = [
    { email: 'alex.thompson@studenttest.com', firstName: 'Alex', lastName: 'Thompson' },
    { email: 'michael.lee@studenttest.com', firstName: 'Michael', lastName: 'Lee' },
    { email: 'david.kim@studenttest.com', firstName: 'David', lastName: 'Kim' },
    { email: 'ethan.davis@studenttest.com', firstName: 'Ethan', lastName: 'Davis' },
    { email: 'isabella.anderson@studenttest.com', firstName: 'Isabella', lastName: 'Anderson' },
    { email: 'olivia.brown@studenttest.com', firstName: 'Olivia', lastName: 'Brown' },
    { email: 'noah.garcia@studenttest.com', firstName: 'Noah', lastName: 'Garcia' },
  ]

  for (const s of realisticStudents) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        password: await hash('StudentTest123!', 12),
        role: 'STUDENT',
        firstName: s.firstName,
        lastName: s.lastName,
        isActive: true,
        isVerified: true,
      }
    })

    await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        gradeLevel: '10',
      }
    })
  }

  console.log('✅ Created realistic test users')

  // Create notification preferences
  await prisma.notificationPreference.upsert({
    where: { userId: tutorUser.id },
    update: {},
    create: {
      userId: tutorUser.id,
      emailNotifications: true,
      smsNotifications: false,
      reminderTiming: 24,
      assignmentReminders: true,
      marketingEmails: false,
    },
  })

  await prisma.notificationPreference.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      emailNotifications: true,
      smsNotifications: true,
      reminderTiming: 2, // 2 hours before
      assignmentReminders: true,
      marketingEmails: true,
    },
  })

  console.log('✅ Created notification preferences')

  // Create tutor availability
  const availabilitySlots = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }, // Monday
    { dayOfWeek: 1, startTime: '14:00', endTime: '17:00' }, // Monday afternoon
    { dayOfWeek: 3, startTime: '09:00', endTime: '12:00' }, // Wednesday
    { dayOfWeek: 3, startTime: '14:00', endTime: '17:00' }, // Wednesday afternoon
    { dayOfWeek: 5, startTime: '09:00', endTime: '12:00' }, // Friday
    { dayOfWeek: 6, startTime: '10:00', endTime: '15:00' }, // Saturday
  ]

  for (const slot of availabilitySlots) {
    await prisma.availability.upsert({
      where: {
        tutorId_dayOfWeek_startTime: {
          tutorId: tutorProfile.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
        },
      },
      update: {},
      create: {
        tutorId: tutorProfile.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: true,
      },
    })
  }

  console.log('✅ Created tutor availability slots')

  // Create sample advertisements
  const ads = [
    {
      title: 'Premium Math Course',
      content: 'Master calculus with our intensive 8-week program',
      targetUrl: 'https://mathcourse.example.com',
      position: 'sidebar',
      targetAudience: 'students',
    },
    {
      title: 'Become a Certified Tutor',
      content: 'Join our platform and start teaching today',
      targetUrl: 'https://signup.example.com/tutor',
      position: 'header',
      targetAudience: 'all',
    },
  ]

  for (const ad of ads) {
    await prisma.advertisement.create({
      data: {
        ...ad,
        active: true,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })
  }

  console.log('✅ Created sample advertisements')

  console.log('🎉 Database seeding completed! Time for coffee ☕')
  console.log('📧 Login credentials (please change these in production):')
  console.log('   Admin: admin@tutoringcalendar.com / admin123')
  console.log('   Tutor: tutor@example.com / tutor123')
  console.log('   Student: student@example.com / student123')
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
