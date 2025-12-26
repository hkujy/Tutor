/**
 * Comprehensive Login Diagnostic
 * Tests the exact same flow as the browser demo button
 */

async function testDemoLogin() {
    console.log('🔍 COMPREHENSIVE LOGIN DIAGNOSTIC\n')
    console.log('='.repeat(60))

    // Test 1: Database check
    console.log('\n📋 Test 1: Database User Check')
    console.log('-'.repeat(60))

    const { PrismaClient } = require('@prisma/client')
    const db = new PrismaClient()

    try {
        const user = await db.user.findUnique({
            where: { email: 'student@example.com', isActive: true },
            select: { email: true, role: true, isActive: true, password: true }
        })

        if (user) {
            console.log('✅ User exists in database')
            console.log('   Email:', user.email)
            console.log('   Role:', user.role)
            console.log('   Active:', user.isActive)
            console.log('   Has password:', !!user.password)

            // Test password
            const bcrypt = require('bcryptjs')
            const match = await bcrypt.compare('student123', user.password)
            console.log('   Password valid:', match ? '✅ YES' : '❌ NO')
        } else {
            console.log('❌ User not found!')
        }
    } catch (error) {
        console.log('❌ Database error:', error.message)
    } finally {
        await db.$disconnect()
    }

    // Test 2: NextAuth Provider Check
    console.log('\n📋 Test 2: NextAuth API Check')
    console.log('-'.repeat(60))

    try {
        const response = await fetch('http://localhost:3000/api/auth/providers')
        const providers = await response.json()
        console.log('✅ NextAuth responding')
        console.log('   Providers:', Object.keys(providers))
        console.log('   Credentials provider:', providers.credentials ? '✅ Available' : '❌ Missing')
    } catch (error) {
        console.log('❌ NextAuth API error:', error.message)
    }

    // Test 3: CSRF Token Check
    console.log('\n📋 Test 3: CSRF Token Check')
    console.log('-'.repeat(60))

    try {
        const response = await fetch('http://localhost:3000/api/auth/csrf')
        const data = await response.json()
        console.log('✅ CSRF endpoint responding')
        console.log('   Token:', data.csrfToken ? `${data.csrfToken.substring(0, 20)}...` : '❌ Missing')
    } catch (error) {
        console.log('❌ CSRF error:', error.message)
    }

    // Test 4: Actual Login Attempt
    console.log('\n📋 Test 4: Simulated Browser Login')
    console.log('-'.repeat(60))

    try {
        // First, get CSRF token
        const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf')
        const { csrfToken } = await csrfResponse.json()
        console.log('📝 Got CSRF token:', csrfToken.substring(0, 20) + '...')

        // Now attempt login
        console.log('🔐 Attempting login...')

        const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'student@example.com',
                password: 'student123',
                csrfToken: csrfToken,
                callbackUrl: 'http://localhost:3000/en/student',
                json: 'true'
            })
        })

        console.log('📡 Response status:', loginResponse.status)
        console.log('📡 Response statusText:', loginResponse.statusText)

        const loginResult = await loginResponse.json().catch(() => loginResponse.text())
        console.log('📡 Response body:', typeof loginResult === 'string' ? loginResult.substring(0, 200) : JSON.stringify(loginResult, null, 2))

        if (loginResponse.ok) {
            console.log('\\n✅ LOGIN SUCCESSFUL!')
        } else {
            console.log('\\n❌ LOGIN FAILED!')
            console.log('   This matches the browser error')
        }

    } catch (error) {
        console.log('❌ Login attempt error:', error.message)
    }

    // Test 5: Check for error in NextAuth logs
    console.log('\n📋 Test 5: Recommendation')
    console.log('-'.repeat(60))
    console.log('👉 Check the terminal running `npm run dev` for any errors')
    console.log('👉 Look for lines starting with "Authentication error:"')
  console.log('Error code will tell us what is failing')
  
  console.log('\n' + '='.repeat(60))
  console.log('🏁 Diagnostic Complete\n')
}

testDemoLogin()
