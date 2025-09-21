#!/bin/bash

cd /home/jy/tutoring-calendar

echo "=== Checking All Students ==="
echo ""

# Use Prisma client to check database
cat > check-students-temp.js << 'EOF'
const { PrismaClient } = require('@prisma/client')

process.env.DATABASE_URL = "postgresql://dev_user:dev_password@localhost:5432/tutoring_calendar"
process.env.DIRECT_URL = "postgresql://dev_user:dev_password@localhost:5432/tutoring_calendar"

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📚 STUDENTS DATABASE REPORT')
    console.log('=' .repeat(50))
    
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        student: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Total Students: ${users.length}`)
    console.log('')
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Phone: ${user.phone || 'Not provided'}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Registered: ${user.createdAt.toLocaleDateString()}`)
      console.log(`   Student Profile: ${user.student ? '✅ Created' : '❌ Missing'}`)
      if (user.student) {
        console.log(`   Grade Level: ${user.student.gradeLevel || 'Not set'}`)
        console.log(`   Subjects: ${user.student.subjects.length > 0 ? user.student.subjects.join(', ') : 'None set'}`)
      }
      console.log('')
    })
    
    // Also check tutors for completeness
    const tutors = await prisma.user.findMany({
      where: { role: 'TUTOR' },
      include: { tutor: true }
    })
    
    console.log(`📖 Total Tutors: ${tutors.length}`)
    tutors.forEach((tutor, index) => {
      console.log(`${index + 1}. ${tutor.firstName} ${tutor.lastName} (${tutor.email})`)
    })
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
EOF

# Run the check
echo "Loading student data..."
sleep 1
node check-students-temp.js
rm check-students-temp.js
