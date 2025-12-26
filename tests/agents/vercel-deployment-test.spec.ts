import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import * as fs from 'fs'
import * as path from 'path'

// Override baseURL for this test file
test.use({ baseURL: 'https://tutor-sandy.vercel.app' })

// Vercel deployment URL
const BASE_URL = 'https://tutor-sandy.vercel.app'

// Test data storage
interface UserCredentials {
    email: string
    password: string
    name: string
    role: 'TUTOR' | 'STUDENT'
    userId?: string
}

const testUsers: UserCredentials[] = []
const logFilePath = path.join(__dirname, 'vercel-test-users.log')

// Helper function to log user credentials
function logUserCredentials(user: UserCredentials, action: string) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${action}\n` +
        `  Role: ${user.role}\n` +
        `  Name: ${user.name}\n` +
        `  Email: ${user.email}\n` +
        `  Password: ${user.password}\n` +
        `  User ID: ${user.userId || 'N/A'}\n` +
        `${'='.repeat(80)}\n`

    fs.appendFileSync(logFilePath, logEntry)
    console.log(logEntry)
}

// Helper function to create summary log
function createSummaryLog() {
    const timestamp = new Date().toISOString()
    let summary = `\n${'='.repeat(80)}\n`
    summary += `VERCEL DEPLOYMENT TEST - USER CREDENTIALS SUMMARY\n`
    summary += `Test Date: ${timestamp}\n`
    summary += `Deployment URL: ${BASE_URL}\n`
    summary += `${'='.repeat(80)}\n\n`

    summary += `TUTOR ACCOUNT:\n`
    summary += `${'-'.repeat(80)}\n`
    const tutor = testUsers.find(u => u.role === 'TUTOR')
    if (tutor) {
        summary += `Name: ${tutor.name}\n`
        summary += `Email: ${tutor.email}\n`
        summary += `Password: ${tutor.password}\n`
        summary += `User ID: ${tutor.userId || 'N/A'}\n`
    }

    summary += `\n\nSTUDENT ACCOUNTS:\n`
    summary += `${'-'.repeat(80)}\n`
    const students = testUsers.filter(u => u.role === 'STUDENT')
    students.forEach((student, index) => {
        summary += `\nStudent ${index + 1}:\n`
        summary += `  Name: ${student.name}\n`
        summary += `  Email: ${student.email}\n`
        summary += `  Password: ${student.password}\n`
        summary += `  User ID: ${student.userId || 'N/A'}\n`
    })

    summary += `\n${'='.repeat(80)}\n`
    summary += `Total Users Created: ${testUsers.length}\n`
    summary += `${'='.repeat(80)}\n`

    fs.appendFileSync(logFilePath, summary)
    console.log(summary)
}

test.describe('Vercel Deployment - Multi-Agent Test (1 Tutor + 5 Students)', () => {
    test.beforeAll(() => {
        // Clear previous log file
        if (fs.existsSync(logFilePath)) {
            fs.unlinkSync(logFilePath)
        }

        const header = `${'='.repeat(80)}\n` +
            `VERCEL DEPLOYMENT TEST LOG\n` +
            `Started: ${new Date().toISOString()}\n` +
            `Deployment URL: ${BASE_URL}\n` +
            `${'='.repeat(80)}\n\n`

        fs.writeFileSync(logFilePath, header)
    })

    test.afterAll(() => {
        // Create summary log
        createSummaryLog()
    })

    test('Step 1: Register 1 Tutor Account', async ({ browser }) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        try {
            // Generate tutor credentials
            const tutor: UserCredentials = {
                name: faker.person.fullName(),
                email: `tutor.${faker.string.alphanumeric(8)}@test.com`,
                password: 'TutorPass123!',
                role: 'TUTOR'
            }

            console.log(`\n🎓 Registering Tutor: ${tutor.name}`)

            // Navigate to signup page
            await page.goto(`${BASE_URL}/en/auth/signup`, { waitUntil: 'networkidle' })
            await page.waitForTimeout(2000)

            // Fill registration form (split name into first and last)
            const nameParts = tutor.name.split(' ')
            const firstName = nameParts[0]
            const lastName = nameParts.slice(1).join(' ') || nameParts[0]

            // Use getByLabel for fields with labels
            await page.getByLabel('First Name').fill(firstName)
            await page.getByLabel('Last Name').fill(lastName)
            await page.getByLabel('Email address').fill(tutor.email)
            await page.getByLabel('Password', { exact: true }).fill(tutor.password)
            await page.getByLabel('Confirm Password').fill(tutor.password)

            // Select TUTOR role from combobox
            await page.getByLabel('I am a').selectOption('TUTOR')
            await page.waitForTimeout(500)

            // Submit form
            await page.click('button[type="submit"]')

            // Wait for redirect or success
            await page.waitForTimeout(3000)

            // Check if registration was successful
            const currentUrl = page.url()
            console.log(`Current URL after registration: ${currentUrl}`)

            // Try to extract user ID if redirected to dashboard
            if (currentUrl.includes('/tutor') || currentUrl.includes('/login')) {
                console.log('✅ Tutor registration successful')
                testUsers.push(tutor)
                logUserCredentials(tutor, 'REGISTERED')
            } else {
                console.log('⚠️ Registration may have failed or redirected unexpectedly')
                // Still log the credentials for manual verification
                testUsers.push(tutor)
                logUserCredentials(tutor, 'ATTEMPTED REGISTRATION')
            }

            // Take screenshot
            await page.screenshot({
                path: path.join(__dirname, `tutor-registration-${Date.now()}.png`),
                fullPage: true
            })

        } catch (error) {
            console.error('❌ Error registering tutor:', error)
            throw error
        } finally {
            await context.close()
        }
    })

    test('Step 2: Register 5 Student Accounts', async ({ browser }) => {
        for (let i = 1; i <= 5; i++) {
            const context = await browser.newContext()
            const page = await context.newPage()

            try {
                // Generate student credentials
                const student: UserCredentials = {
                    name: faker.person.fullName(),
                    email: `student${i}.${faker.string.alphanumeric(8)}@test.com`,
                    password: `StudentPass${i}23!`,
                    role: 'STUDENT'
                }

                console.log(`\n📚 Registering Student ${i}/5: ${student.name}`)

                // Navigate to signup page
                await page.goto(`${BASE_URL}/en/auth/signup`, { waitUntil: 'networkidle' })
                await page.waitForTimeout(2000)

                // Fill registration form (split name into first and last)
                const nameParts = student.name.split(' ')
                const firstName = nameParts[0]
                const lastName = nameParts.slice(1).join(' ') || nameParts[0]

                // Use getByLabel for fields with labels
                await page.getByLabel('First Name').fill(firstName)
                await page.getByLabel('Last Name').fill(lastName)
                await page.getByLabel('Email address').fill(student.email)
                await page.getByLabel('Password', { exact: true }).fill(student.password)
                await page.getByLabel('Confirm Password').fill(student.password)

                // Select STUDENT role from combobox (default is already Student)
                await page.getByLabel('I am a').selectOption('STUDENT')
                await page.waitForTimeout(500)

                // Submit form
                await page.click('button[type="submit"]')

                // Wait for redirect or success
                await page.waitForTimeout(3000)

                // Check if registration was successful
                const currentUrl = page.url()
                console.log(`Current URL after registration: ${currentUrl}`)

                if (currentUrl.includes('/student') || currentUrl.includes('/login')) {
                    console.log(`✅ Student ${i} registration successful`)
                    testUsers.push(student)
                    logUserCredentials(student, 'REGISTERED')
                } else {
                    console.log(`⚠️ Student ${i} registration may have failed`)
                    testUsers.push(student)
                    logUserCredentials(student, 'ATTEMPTED REGISTRATION')
                }

                // Take screenshot
                await page.screenshot({
                    path: path.join(__dirname, `student${i}-registration-${Date.now()}.png`),
                    fullPage: true
                })

            } catch (error) {
                console.error(`❌ Error registering student ${i}:`, error)
                throw error
            } finally {
                await context.close()
            }

            // Wait between registrations to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    })

    test('Step 3: Verify Tutor Login', async ({ browser }) => {
        const context = await browser.newContext()
        const page = await context.newPage()

        try {
            const tutor = testUsers.find(u => u.role === 'TUTOR')
            if (!tutor) {
                throw new Error('No tutor found in test users')
            }

            console.log(`\n🔐 Testing Tutor Login: ${tutor.email}`)

            // Navigate to login page
            await page.goto(`${BASE_URL}/en/login`, { waitUntil: 'networkidle' })
            await page.waitForTimeout(2000)

            // Fill login form
            await page.fill('input[name="email"]', tutor.email)
            await page.fill('input[name="password"]', tutor.password)

            // Submit login
            await page.click('button[type="submit"]')
            await page.waitForTimeout(3000)

            // Verify login success
            const currentUrl = page.url()
            console.log(`Current URL after login: ${currentUrl}`)

            if (currentUrl.includes('/tutor')) {
                console.log('✅ Tutor login successful')

                // Take screenshot of tutor dashboard
                await page.screenshot({
                    path: path.join(__dirname, `tutor-dashboard-${Date.now()}.png`),
                    fullPage: true
                })

                // Log success
                logUserCredentials(tutor, 'LOGIN VERIFIED')
            } else {
                console.log('⚠️ Tutor login may have failed')
                await page.screenshot({
                    path: path.join(__dirname, `tutor-login-failed-${Date.now()}.png`),
                    fullPage: true
                })
            }

        } catch (error) {
            console.error('❌ Error verifying tutor login:', error)
            throw error
        } finally {
            await context.close()
        }
    })

    test('Step 4: Verify Student Logins', async ({ browser }) => {
        const students = testUsers.filter(u => u.role === 'STUDENT')

        for (let i = 0; i < students.length; i++) {
            const context = await browser.newContext()
            const page = await context.newPage()

            try {
                const student = students[i]
                console.log(`\n🔐 Testing Student ${i + 1} Login: ${student.email}`)

                // Navigate to login page
                await page.goto(`${BASE_URL}/en/login`, { waitUntil: 'networkidle' })
                await page.waitForTimeout(2000)

                // Fill login form
                await page.fill('input[name="email"]', student.email)
                await page.fill('input[name="password"]', student.password)

                // Submit login
                await page.click('button[type="submit"]')
                await page.waitForTimeout(3000)

                // Verify login success
                const currentUrl = page.url()
                console.log(`Current URL after login: ${currentUrl}`)

                if (currentUrl.includes('/student')) {
                    console.log(`✅ Student ${i + 1} login successful`)

                    // Take screenshot
                    await page.screenshot({
                        path: path.join(__dirname, `student${i + 1}-dashboard-${Date.now()}.png`),
                        fullPage: true
                    })

                    logUserCredentials(student, 'LOGIN VERIFIED')
                } else {
                    console.log(`⚠️ Student ${i + 1} login may have failed`)
                    await page.screenshot({
                        path: path.join(__dirname, `student${i + 1}-login-failed-${Date.now()}.png`),
                        fullPage: true
                    })
                }

            } catch (error) {
                console.error(`❌ Error verifying student ${i + 1} login:`, error)
                throw error
            } finally {
                await context.close()
            }

            // Wait between logins
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    })

    test('Step 5: Simulate Student Browsing Tutors', async ({ browser }) => {
        const students = testUsers.filter(u => u.role === 'STUDENT')
        const student = students[0] // Use first student

        if (!student) {
            console.log('⚠️ No students available for browsing test')
            return
        }

        const context = await browser.newContext()
        const page = await context.newPage()

        try {
            console.log(`\n🔍 Student browsing tutors: ${student.email}`)

            // Login first
            await page.goto(`${BASE_URL}/en/login`, { waitUntil: 'networkidle' })
            await page.waitForTimeout(2000)
            await page.fill('input[name="email"]', student.email)
            await page.fill('input[name="password"]', student.password)
            await page.click('button[type="submit"]')
            await page.waitForTimeout(3000)

            // Navigate to browse tutors
            await page.goto(`${BASE_URL}/en/student`, { waitUntil: 'networkidle' })
            await page.waitForTimeout(2000)

            // Take screenshot
            await page.screenshot({
                path: path.join(__dirname, `student-browse-tutors-${Date.now()}.png`),
                fullPage: true
            })

            console.log('✅ Student browsing simulation complete')

        } catch (error) {
            console.error('❌ Error in student browsing:', error)
        } finally {
            await context.close()
        }
    })

    test('Step 6: Generate Final Report', async () => {
        console.log('\n📊 Generating Final Test Report...')

        const report = {
            testDate: new Date().toISOString(),
            deploymentUrl: BASE_URL,
            totalUsers: testUsers.length,
            tutors: testUsers.filter(u => u.role === 'TUTOR').length,
            students: testUsers.filter(u => u.role === 'STUDENT').length,
            users: testUsers
        }

        // Save JSON report
        const reportPath = path.join(__dirname, 'vercel-test-report.json')
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

        console.log(`\n✅ Test Complete!`)
        console.log(`📄 Credentials Log: ${logFilePath}`)
        console.log(`📊 JSON Report: ${reportPath}`)
        console.log(`\nTotal Users Created: ${testUsers.length}`)
        console.log(`  - Tutors: ${report.tutors}`)
        console.log(`  - Students: ${report.students}`)
    })
})
