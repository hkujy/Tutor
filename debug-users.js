process.env.DATABASE_URL = "postgresql://dev_user:dev_password@localhost:5432/tutoring_calendar"
process.env.DIRECT_URL = "postgresql://dev_user:dev_password@localhost:5432/tutoring_calendar"

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Checking users...')
    const users = await prisma.user.findMany({
      include: {
        student: true,
        tutor: true
      }
    })
    
    console.log('Users found:', users.length)
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
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
