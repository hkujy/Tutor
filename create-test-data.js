process.env.DATABASE_URL = "postgresql://tutoring:password@localhost:5433/tutoring_calendar_dev"
process.env.DIRECT_URL = "postgresql://tutoring:password@localhost:5433/tutoring_calendar_dev"

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestData() {
  try {
    console.log('Creating test data...')
    
    // Get the tutor and student
    const tutor = await prisma.user.findFirst({
      where: { role: 'TUTOR' },
      include: { tutor: true }
    })
    
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      include: { student: true }
    })
    
    console.log('Found tutor:', tutor.firstName, tutor.lastName)
    console.log('Found student:', student.firstName, student.lastName)
    
    // Create an appointment
    const appointment = await prisma.appointment.create({
      data: {
        studentId: student.student.id,
        tutorId: tutor.tutor.id,
        subject: 'Mathematics',
        startTime: new Date('2025-01-06T10:00:00'),
        endTime: new Date('2025-01-06T11:00:00'),
        status: 'SCHEDULED',
        notes: 'Test appointment for algebra tutoring'
      }
    })
    
    console.log('Created appointment:', appointment.id)
    
    // Create another appointment that we can mark as completed
    const appointment2 = await prisma.appointment.create({
      data: {
        studentId: student.student.id,
        tutorId: tutor.tutor.id,
        subject: 'Physics',
        startTime: new Date('2025-01-05T14:00:00'),
        endTime: new Date('2025-01-05T15:30:00'),
        status: 'SCHEDULED',
        notes: 'Test appointment for mechanics'
      }
    })
    
    console.log('Created second appointment:', appointment2.id)
    
    console.log('Test data created successfully!')
    
  } catch (error) {
    console.error('Error creating test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestData()