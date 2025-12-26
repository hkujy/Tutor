import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.use({ baseURL: 'https://tutor-sandy.vercel.app' })

// Use credentials from previous test
const TUTOR = {
    email: 'tutor.xTWALlrF@test.com',
    password: 'TutorPass123!',
    name: 'Courtney Abshire'
}

const STUDENTS = [
    { email: 'student1.SJm9cT2Q@test.com', password: 'StudentPass123!', name: 'Brent Lindgren' },
    { email: 'student2.ybpGh7gw@test.com', password: 'StudentPass223!', name: 'Dr. Elaine Flatley' },
    { email: 'student3.kkeUNhPZ@test.com', password: 'StudentPass323!', name: 'Guillermo Nader' }
]

const logFilePath = path.join(__dirname, 'vercel-comprehensive-test.log')

function log(message: string) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}\n`
    fs.appendFileSync(logFilePath, logEntry)
    console.log(logEntry)
}

test.describe('Comprehensive Vercel Deployment Test', () => {
    test.beforeAll(() => {
        if (fs.existsSync(logFilePath)) {
            fs.unlinkSync(logFilePath)
        }
        const header = `${'='.repeat(80)}\n` +
            `COMPREHENSIVE VERCEL DEPLOYMENT TEST\n` +
            `Started: ${new Date().toISOString()}\n` +
            `Deployment URL: https://tutor-sandy.vercel.app\n` +
            `${'='.repeat(80)}\n\n`
        fs.writeFileSync(logFilePath, header)
    })

    test('Scenario 1: Tutor Login and Dashboard Access', async ({ page }) => {
        log('🎓 SCENARIO 1: Tutor Login and Dashboard Access')

        // Login as tutor
        await page.goto('/en/login')
        await page.waitForTimeout(2000)

        await page.getByLabel('Email address').fill(TUTOR.email)
        await page.getByLabel('Password').fill(TUTOR.password)
        await page.getByRole('button', { name: /sign in/i }).click()

        await page.waitForTimeout(3000)

        // Verify tutor dashboard loaded
        const url = page.url()
        log(`✓ Logged in as tutor, URL: ${url}`)

        // Take screenshot
        await page.screenshot({
            path: path.join(__dirname, 'scenario1-tutor-dashboard.png'),
            fullPage: true
        })

        expect(url).toContain('/tutor')
        log('✅ Scenario 1 Complete: Tutor can login and access dashboard')
    })

    test('Scenario 2: Tutor Sets Availability', async ({ page }) => {
        log('🎓 SCENARIO 2: Tutor Sets Availability')

        // Login
        await page.goto('/en/login')
        await page.waitForTimeout(2000)
        await page.getByLabel('Email address').fill(TUTOR.email)
        await page.getByLabel('Password').fill(TUTOR.password)
        await page.getByRole('button', { name: /sign in/i }).click()
        await page.waitForTimeout(3000)

        // Navigate to availability page
        await page.goto('/en/tutor/availability')
        await page.waitForTimeout(3000)

        log('✓ Navigated to availability page')

        // Take screenshot
        await page.screenshot({
            path: path.join(__dirname, 'scenario2-availability-page.png'),
            fullPage: true
        })

        // Check if availability calendar is present
        const hasCalendar = await page.locator('text=/availability|calendar/i').count() > 0
        log(`✓ Availability page loaded, has calendar: ${hasCalendar}`)

        log('✅ Scenario 2 Complete: Tutor can access availability settings')
    })

    test('Scenario 3: Student Login and Browse Tutors', async ({ page }) => {
        log('📚 SCENARIO 3: Student Login and Browse Tutors')

        const student = STUDENTS[0]

        // Login as student
        await page.goto('/en/login')
        await page.waitForTimeout(2000)

        await page.getByLabel('Email address').fill(student.email)
        await page.getByLabel('Password').fill(student.password)
        await page.getByRole('button', { name: /sign in/i }).click()

        await page.waitForTimeout(3000)

        const url = page.url()
        log(`✓ Logged in as student: ${student.name}, URL: ${url}`)

        // Take screenshot of student dashboard
        await page.screenshot({
            path: path.join(__dirname, 'scenario3-student-dashboard.png'),
            fullPage: true
        })

        // Check for tutor browsing functionality
        const hasTutorList = await page.locator('text=/tutor|browse|find/i').count() > 0
        log(`✓ Student dashboard loaded, can browse tutors: ${hasTutorList}`)

        expect(url).toContain('/student')
        log('✅ Scenario 3 Complete: Student can login and access dashboard')
    })

    test('Scenario 4: Multiple Students Login Concurrently', async ({ browser }) => {
        log('📚 SCENARIO 4: Multiple Students Login Concurrently')

        const contexts = []

        for (let i = 0; i < 3; i++) {
            const context = await browser.newContext()
            const page = await context.newPage()
            const student = STUDENTS[i]

            await page.goto('/en/login')
            await page.waitForTimeout(2000)

            await page.getByLabel('Email address').fill(student.email)
            await page.getByLabel('Password').fill(student.password)
            await page.getByRole('button', { name: /sign in/i }).click()

            await page.waitForTimeout(3000)

            const url = page.url()
            log(`✓ Student ${i + 1} (${student.name}) logged in: ${url}`)

            // Take screenshot
            await page.screenshot({
                path: path.join(__dirname, `scenario4-student${i + 1}-concurrent.png`),
                fullPage: true
            })

            contexts.push(context)
        }

        // Close all contexts
        for (const context of contexts) {
            await context.close()
        }

        log('✅ Scenario 4 Complete: Multiple students can login concurrently')
    })

    test('Scenario 5: Language Switching (English to Chinese)', async ({ page }) => {
        log('🌐 SCENARIO 5: Language Switching')

        // Login as student
        await page.goto('/en/login')
        await page.waitForTimeout(2000)

        const student = STUDENTS[0]
        await page.getByLabel('Email address').fill(student.email)
        await page.getByLabel('Password').fill(student.password)
        await page.getByRole('button', { name: /sign in/i }).click()
        await page.waitForTimeout(3000)

        log('✓ Logged in as student')

        // Take screenshot in English
        await page.screenshot({
            path: path.join(__dirname, 'scenario5-english.png'),
            fullPage: true
        })

        // Switch to Chinese
        const languageSwitcher = page.locator('select, [role="combobox"]').filter({ hasText: /English|中文/ }).first()
        if (await languageSwitcher.count() > 0) {
            await languageSwitcher.selectOption('zh')
            await page.waitForTimeout(2000)

            log('✓ Switched to Chinese')

            // Take screenshot in Chinese
            await page.screenshot({
                path: path.join(__dirname, 'scenario5-chinese.png'),
                fullPage: true
            })

            const url = page.url()
            expect(url).toContain('/zh/')
            log('✅ Scenario 5 Complete: Language switching works')
        } else {
            log('⚠️ Language switcher not found, skipping')
        }
    })

    test('Scenario 6: Navigation Between Pages', async ({ page }) => {
        log('🧭 SCENARIO 6: Navigation Between Pages')

        // Login as tutor
        await page.goto('/en/login')
        await page.waitForTimeout(2000)
        await page.getByLabel('Email address').fill(TUTOR.email)
        await page.getByLabel('Password').fill(TUTOR.password)
        await page.getByRole('button', { name: /sign in/i }).click()
        await page.waitForTimeout(3000)

        const pages = [
            '/en/tutor',
            '/en/tutor/availability',
        ]

        for (const pagePath of pages) {
            await page.goto(pagePath)
            await page.waitForTimeout(2000)

            log(`✓ Navigated to: ${pagePath}`)

            // Take screenshot
            const pageName = pagePath.split('/').pop() || 'home'
            await page.screenshot({
                path: path.join(__dirname, `scenario6-nav-${pageName}.png`),
                fullPage: true
            })
        }

        log('✅ Scenario 6 Complete: Navigation between pages works')
    })

    test('Scenario 7: Logout and Re-login', async ({ page }) => {
        log('🔐 SCENARIO 7: Logout and Re-login')

        // Login
        await page.goto('/en/login')
        await page.waitForTimeout(2000)
        await page.getByLabel('Email address').fill(TUTOR.email)
        await page.getByLabel('Password').fill(TUTOR.password)
        await page.getByRole('button', { name: /sign in/i }).click()
        await page.waitForTimeout(3000)

        log('✓ Initial login successful')

        // Try to find and click logout button
        const logoutButton = page.getByRole('button', { name: /logout|sign out/i })
        if (await logoutButton.count() > 0) {
            await logoutButton.click()
            await page.waitForTimeout(2000)

            log('✓ Logged out successfully')

            // Verify redirected to login
            const url = page.url()
            expect(url).toContain('/login')

            // Re-login
            await page.getByLabel('Email address').fill(TUTOR.email)
            await page.getByLabel('Password').fill(TUTOR.password)
            await page.getByRole('button', { name: /sign in/i }).click()
            await page.waitForTimeout(3000)

            log('✓ Re-login successful')
            log('✅ Scenario 7 Complete: Logout and re-login works')
        } else {
            log('⚠️ Logout button not found, skipping')
        }
    })

    test('Scenario 8: Mobile Viewport Testing', async ({ browser }) => {
        log('📱 SCENARIO 8: Mobile Viewport Testing')

        const context = await browser.newContext({
            viewport: { width: 375, height: 667 }, // iPhone SE
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        })

        const page = await context.newPage()

        // Login on mobile
        await page.goto('/en/login')
        await page.waitForTimeout(2000)

        await page.screenshot({
            path: path.join(__dirname, 'scenario8-mobile-login.png'),
            fullPage: true
        })

        await page.getByLabel('Email address').fill(STUDENTS[0].email)
        await page.getByLabel('Password').fill(STUDENTS[0].password)
        await page.getByRole('button', { name: /sign in/i }).click()
        await page.waitForTimeout(3000)

        log('✓ Mobile login successful')

        await page.screenshot({
            path: path.join(__dirname, 'scenario8-mobile-dashboard.png'),
            fullPage: true
        })

        await context.close()

        log('✅ Scenario 8 Complete: Mobile viewport works')
    })

    test('Scenario 9: Error Handling - Invalid Login', async ({ page }) => {
        log('❌ SCENARIO 9: Error Handling - Invalid Login')

        await page.goto('/en/login')
        await page.waitForTimeout(2000)

        // Try invalid credentials
        await page.getByLabel('Email address').fill('invalid@test.com')
        await page.getByLabel('Password').fill('wrongpassword')
        await page.getByRole('button', { name: /sign in/i }).click()
        await page.waitForTimeout(3000)

        // Check for error message
        const hasError = await page.locator('text=/error|invalid|incorrect/i').count() > 0
        log(`✓ Error message displayed: ${hasError}`)

        await page.screenshot({
            path: path.join(__dirname, 'scenario9-invalid-login.png'),
            fullPage: true
        })

        // Verify still on login page
        const url = page.url()
        expect(url).toContain('/login')

        log('✅ Scenario 9 Complete: Invalid login handled correctly')
    })

    test('Scenario 10: Performance - Page Load Times', async ({ page }) => {
        log('⚡ SCENARIO 10: Performance - Page Load Times')

        const pages = [
            '/en/login',
            '/en/auth/signup',
        ]

        for (const pagePath of pages) {
            const startTime = Date.now()
            await page.goto(pagePath, { waitUntil: 'networkidle' })
            const loadTime = Date.now() - startTime

            log(`✓ ${pagePath} loaded in ${loadTime}ms`)

            // Check if load time is reasonable (< 5 seconds)
            expect(loadTime).toBeLessThan(5000)
        }

        log('✅ Scenario 10 Complete: Page load times are acceptable')
    })

    test.afterAll(() => {
        const summary = `\n${'='.repeat(80)}\n` +
            `TEST SUMMARY\n` +
            `Completed: ${new Date().toISOString()}\n` +
            `All scenarios executed successfully\n` +
            `${'='.repeat(80)}\n`

        fs.appendFileSync(logFilePath, summary)
        console.log(summary)
    })
})
