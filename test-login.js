// Test login credentials
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testLogin() {
    console.log('🔍 Testing login credentials...\n')

    const testCases = [
        { email: 'tutor_no1@example.com', password: 'tutor123' },
        { email: 'sarah.chen@tutortest.com', password: 'TutorTest123!' },
    ]

    for (const test of testCases) {
        try {
            console.log(`Testing: ${test.email}`)

            // Find user
            const user = await prisma.user.findUnique({
                where: { email: test.email }
            })

            if (!user) {
                console.log(`  ❌ User not found\n`)
                continue
            }

            console.log(`  ✓ User found: ${user.firstName} ${user.lastName}`)
            console.log(`  Password hash: ${user.password.substring(0, 20)}...`)

            // Test password
            const isValid = await bcrypt.compare(test.password, user.password)

            if (isValid) {
                console.log(`  ✅ Password "${test.password}" is CORRECT\n`)
            } else {
                console.log(`  ❌ Password "${test.password}" is WRONG\n`)
            }

        } catch (error) {
            console.error(`  ❌ Error:`, error.message, '\n')
        }
    }

    await prisma.$disconnect()
}

testLogin()
