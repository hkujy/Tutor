import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

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
      specializations: ['Mathematics', 'Physics', 'Chemistry'],
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
      subjects: ['Mathematics', 'Physics'],
      learningGoals:
        'Improve calculus understanding and prepare for college entrance exams',
      parentContact: 'parent@example.com',
    },
  })

  console.log('✅ Created student profile for:', studentUser.email)

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

  console.log('🎉 Database seeding completed!')
  console.log('📧 Login credentials:')
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
