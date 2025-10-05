process.env.DATABASE_URL = "postgresql://tutoring:password@localhost:5433/tutoring_calendar_dev"
process.env.DIRECT_URL = "postgresql://tutoring:password@localhost:5433/tutoring_calendar_dev"

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Checking ALL users...')
    const users = await prisma.user.findMany({
      where: {},
      include: {
        student: true,
        tutor: true
      }
    })
    
    console.log('Total users found:', users.length)
    users.forEach(user => {
      console.log(`
User: ${user.firstName} ${user.lastName}
Email: ${user.email}
Role: ${user.role}
ID: ${user.id}
Created: ${user.createdAt}
Student Profile: ${user.student ? 'Yes' : 'No'}
Tutor Profile: ${user.tutor ? 'Yes' : 'No'}
      `)
    })
    
    // Specifically check for tutors
    console.log('\n=== TUTOR ROLE USERS ===')
    const tutorUsers = await prisma.user.findMany({
      where: {
        role: 'TUTOR'
      },
      include: {
        tutor: true
      }
    })
    
    console.log('Tutor role users found:', tutorUsers.length)
    tutorUsers.forEach(user => {
      console.log(`Tutor: ${user.firstName} ${user.lastName} (${user.email})`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()