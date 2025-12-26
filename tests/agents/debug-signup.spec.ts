import { test } from '@playwright/test'

test.use({ baseURL: 'https://tutor-sandy.vercel.app' })

test('Debug: Check signup page structure', async ({ page }) => {
    await page.goto('/en/auth/signup', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Take screenshot
    await page.screenshot({ path: 'signup-page-debug.png', fullPage: true })

    // Get page content
    const content = await page.content()
    console.log('Page URL:', page.url())
    console.log('Page title:', await page.title())

    // Check for form elements
    const firstNameInput = await page.locator('input').count()
    console.log('Number of input elements:', firstNameInput)

    // Get all placeholders
    const inputs = await page.locator('input').all()
    for (let i = 0; i < inputs.length; i++) {
        const placeholder = await inputs[i].getAttribute('placeholder')
        const type = await inputs[i].getAttribute('type')
        console.log(`Input ${i}: type=${type}, placeholder=${placeholder}`)
    }

    // Check for select elements
    const selects = await page.locator('select').count()
    console.log('Number of select elements:', selects)
})
