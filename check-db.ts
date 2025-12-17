import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking database for users...')
  
  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      student: true,
      tutor: true,
    }
  })

  console.log(`Found ${allUsers.length} total users in the database.`)

  allUsers.forEach(user => {
    console.log('------------------------------------------------')
    console.log(`Email: ${user.email}`)
    console.log(`ID: ${user.id}`)
    console.log(`Role: ${user.role}`)
    console.log(`Created: ${user.createdAt}`)
    
    if (user.student) {
      console.log('Student Profile:')
      console.log(`  Grade Level: ${user.student.gradeLevel}`)
      console.log(`  Subjects: ${user.student.subjects.join(', ')}`)
    } else if (user.tutor) {
      console.log('Tutor Profile:')
      console.log(`  Hourly Rate: ${user.tutor.hourlyRate}`)
    }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
