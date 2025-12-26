import { test, expect } from '@playwright/test'
import * as path from 'path'

test.use({ baseURL: 'https://tutor-sandy.vercel.app' })

test.describe('UX and Usability Analysis', () => {

    test('Check Login Page Features', async ({ page }) => {
        await page.goto('/en/login')
        await page.waitForTimeout(1000)

        // 1. Check for "Forgot Password"
        const forgotPassword = await page.getByText(/forgot|reset/i).count()
        if (forgotPassword === 0) {
            console.log('ISSUE: No "Forgot Password" link found on login page')
        }

        // 2. Check for "Remember Me"
        const rememberMe = await page.getByText(/remember/i).count()
        if (rememberMe === 0) {
            console.log('SUGGESTION: "Remember Me" option missing')
        }

        await page.screenshot({ path: 'ux-login-analysis.png', fullPage: true })
    })

    test('Check Form Validation UX', async ({ page }) => {
        await page.goto('/en/auth/signup')

        // Submit empty form to see validation style
        await page.getByRole('button', { name: /create/i }).click()
        await page.waitForTimeout(1000)

        await page.screenshot({ path: 'ux-form-validation-empty.png', fullPage: true })

        // Check if html5 validation or custom
        const isHtml5 = await page.evaluate(() => {
            const input = document.querySelector('input')
            return input ? !input.checkValidity() : false
        })
        console.log(`Form Validation Style: ${isHtml5 ? 'HTML5 Native (Basic)' : 'Custom/JS (Better)'}`)

        // Password strength feedback check
        await page.getByPlaceholder('Minimum 8 characters').fill('weak')
        await page.waitForTimeout(500)
        await page.screenshot({ path: 'ux-password-weak.png' })

        // Check if there is specific feedback text
        const feedback = await page.getByText(/weak|short|character/i).isVisible()
        if (!feedback) {
            console.log('IMPROVEMENT: No real-time password strength feedback visible')
        }
    })

    test('Check 404 Page Design', async ({ page }) => {
        await page.goto('/en/random-non-existent-page')
        await page.waitForTimeout(1000)

        const title = await page.title()
        console.log(`404 Page Title: ${title}`)

        // Check if it's a custom 404 or default nextjs
        const bodyText = await page.textContent('body')
        if (bodyText?.includes('404')) {
            await page.screenshot({ path: 'ux-404-page.png', fullPage: true })
        } else {
            console.log('ISSUE: 404 page might be redirecting or broken')
        }
    })

    test('Check Empty States (Student Dashboard)', async ({ page }) => {
        // Log in as a NEW student (no interactions yet)
        await page.goto('/en/login')
        // Using Student 5 from verify test (likely has no bookings)
        await page.getByLabel('Email address').fill('student5.ofGYsiO4@test.com')
        await page.getByLabel('Password').fill('StudentPass523!')
        await page.getByRole('button', { name: /sign in/i }).click()
        await page.waitForTimeout(2000)

        await page.goto('/en/student/bookings') // Assuming this route exists
        await page.waitForTimeout(1000)

        // Check what "No bookings" looks like
        await page.screenshot({ path: 'ux-empty-bookings.png', fullPage: true })

        const hasEmptyStateMessage = await page.getByText(/no bookings|empty/i).count()
        if (hasEmptyStateMessage === 0) {
            console.log('IMPROVEMENT: Empty state for bookings could be more descriptive or include CTA')
        }
    })
})
