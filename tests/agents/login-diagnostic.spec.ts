import { test, expect } from '@playwright/test'

/**
 * Comprehensive Login Diagnostic Test
 * 
 * This test will help identify why demo login fails in the browser
 */

test.describe('Login Diagnostic Tests', () => {

    test('Diagnostic 1: Check login page loads correctly', async ({ page }) => {
        console.log('\n🔍 Test 1: Loading login page...\n')

        await page.goto('http://localhost:3000/en/login')
        await page.waitForLoadState('networkidle')

        // Check page loaded
        const title = await page.title()
        console.log('✅ Page title:', title)

        // Check form elements exist
        const emailInput = await page.locator('#email').count()
        const passwordInput = await page.locator('#password').count()
        const submitButton = await page.locator('button[type="submit"]').count()
        const tutorButton = await page.locator('button:has-text("Tutor")').count()
        const studentButton = await page.locator('button:has-text("Student")').count()

        console.log('Form elements:')
        console.log('  Email input:', emailInput > 0 ? '✅' : '❌')
        console.log('  Password input:', passwordInput > 0 ? '✅' : '❌')
        console.log('  Submit button:', submitButton > 0 ? '✅' : '❌')
        console.log('  Tutor demo button:', tutorButton > 0 ? '✅' : '❌')
        console.log('  Student demo button:', studentButton > 0 ? '✅' : '❌')

        expect(emailInput).toBeGreaterThan(0)
        expect(tutorButton).toBeGreaterThan(0)
    })

    test('Diagnostic 2: Test manual form login', async ({ page }) => {
        console.log('\n🔍 Test 2: Manual form login...\n')

        // Listen for console errors
        const consoleErrors: string[] = []
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text())
            }
        })

        // Listen for failed requests
        const failedRequests: string[] = []
        page.on('requestfailed', request => {
            failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`)
        })

        await page.goto('http://localhost:3000/en/login')
        await page.waitForLoadState('networkidle')

        console.log('Filling form manually...')
        await page.fill('#email', 'student@example.com')
        await page.fill('#password', 'student123')

        console.log('Submitting form...')

        // Capture the response
        const [response] = await Promise.all([
            page.waitForResponse(resp => resp.url().includes('/api/auth/callback/credentials'), { timeout: 15000 }),
            page.click('button[type="submit"]')
        ])

        console.log('Auth callback response:')
        console.log('  URL:', response.url())
        console.log('  Status:', response.status())
        console.log('  Status text:', response.statusText())

        const responseBody = await response.text().catch(() => 'Could not read body')
        console.log('  Body:', responseBody.substring(0, 200))

        // Wait a bit for redirect
        await page.waitForTimeout(3000)

        const currentUrl = page.url()
        console.log('\\nCurrent URL:', currentUrl)
        console.log('Login successful:', currentUrl.includes('/student') ? '✅ YES' : '❌ NO')

        if (consoleErrors.length > 0) {
            console.log('\\n❌ Console errors:')
            consoleErrors.forEach(err => console.log('  -', err))
        }

        if (failedRequests.length > 0) {
            console.log('\\n❌ Failed requests:')
            failedRequests.forEach(req => console.log('  -', req))
        }
    })

    test('Diagnostic 3: Test demo button click', async ({ page }) => {
        console.log('\n🔍 Test 3: Demo button click...\n')

        const consoleMessages: Array<{ type: string, text: string }> = []
        page.on('console', msg => {
            consoleMessages.push({ type: msg.type(), text: msg.text() })
        })

        const networkRequests: Array<{ method: string, url: string }> = []
        page.on('request', request => {
            if (request.url().includes('/api/auth')) {
                networkRequests.push({ method: request.method(), url: request.url() })
            }
        })

        await page.goto('http://localhost:3000/en/login')
        await page.waitForLoadState('networkidle')

        console.log('Clicking Student demo button...')

        // Click the student button
        const studentButton = page.locator('button:has-text("Student")')

        // Wait forresponse
        const responsePromise = page.waitForResponse(
            resp => resp.url().includes('/api/auth/callback'),
            { timeout: 15000 }
        ).catch(() => null)

        await studentButton.click()

        const response = await responsePromise

        if (response) {
            console.log('\\n✅ Auth request made:')
            console.log('  URL:', response.url())
            console.log('  Status:', response.status())

            const body = await response.text().catch(() => 'Could not read')
            console.log('  Body:', body.substring(0, 200))
        } else {
            console.log('\\n❌ No auth request detected!')
        }

        // Wait for any redirect
        await page.waitForTimeout(3000)

        const currentUrl = page.url()
        console.log('\\nFinal URL:', currentUrl)
        console.log('Success:', currentUrl.includes('/student') ? '✅' : '❌')

        // Check for error message on page
        const errorText = await page.locator('text=/demo login failed|invalid.*password/i').textContent().catch(() => null)
        if (errorText) {
            console.log('\\n❌ Error message shown:', errorText)
        }

        console.log('\\n📋 Console messages:')
        consoleMessages.forEach(msg => {
            if (msg.type === 'error') {
                console.log(`  ❌ ${msg.type}: ${msg.text}`)
            }
        })

        console.log('\\n📋 Network requests to /api/auth:')
        networkRequests.forEach(req => {
            console.log(`  ${req.method} ${req.url}`)
        })
    })

    test('Diagnostic 4: Check CSRF token', async ({ page }) => {
        console.log('\n🔍 Test 4: CSRF token check...\n')

        await page.goto('http://localhost:3000/en/login')
        await page.waitForLoadState('networkidle')

        // Check for CSRF meta tag
        const csrfToken = await page.locator('meta[name="csrf-token"]').getAttribute('content').catch(() => null)
        console.log('CSRF meta tag:', csrfToken || '❌ Not found')

        // Check cookies
        const cookies = await page.context().cookies()
        console.log('\\nCookies:')
        cookies.forEach(cookie => {
            console.log(`  ${cookie.name}: ${cookie.value.substring(0, 20)}...`)
        })

        const authCookies = cookies.filter(c => c.name.includes('next-auth') || c.name.includes('csrf'))
        console.log('\\nNextAuth cookies:', authCookies.length)
        authCookies.forEach(cookie => {
            console.log(`  ${cookie.name}`)
        })
    })
})
