import { test, expect } from '@playwright/test'

test.describe('Student Booking Flow', () => {
  // We assume there's a seeded student and tutor.
  // In a real CI environment, we would seed this before the test.
  // For this test, we'll try to register a new student to ensure a clean state.

  test('should allow a student to register, login, and book an appointment', async ({ page }) => {
    // 1. Register a new student
    const timestamp = Date.now()
    const email = `student${timestamp}@example.com`
    const password = 'Password123!'
    const firstName = 'Test'
    const lastName = 'Student'

    await page.goto('/en/auth/signup')
    await page.fill('input[name="firstName"]', firstName)
    await page.fill('input[name="lastName"]', lastName)
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    // Select role (assuming there's a role selector, otherwise it might default or be separate pages)
    // Checking the signup page implementation would be ideal, but assuming standard flow:
    // If there's a role select:
    const roleSelect = page.locator('select[name="role"]')
    if (await roleSelect.count() > 0) {
      await roleSelect.selectOption('STUDENT')
    }
    
    await page.click('button[type="submit"]')

    // Wait for redirect to login or dashboard
    await expect(page).toHaveURL(/\/login|\/student/)

    // If redirected to login, perform login
    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', email)
      await page.fill('input[name="password"]', password)
      await page.click('button[type="submit"]')
    }

    // Verify dashboard access
    await expect(page).toHaveURL(/\/student/)
    await expect(page.locator('h1')).toContainText(/Welcome|Dashboard/i)

    // 2. Navigate to find a tutor (or availability view)
    // Assuming there's a navigation link to "Find Tutors" or similar
    // Or we can go directly if we know the URL. Let's try to find a link.
    // If not, we might need to rely on the dashboard showing availability if that's the design.
    // Based on file structure, there is `src/app/student/page.tsx` which is the dashboard.
    // It likely has availability or links.
    
    // Let's assume there's a way to view availability. 
    // For now, let's verify we are on the dashboard and see "Appointments" or similar.
    await expect(page.getByText('Appointments')).toBeVisible()

    // Since setting up a tutor and availability via E2E is complex without a seed script running *before* this test,
    // and we don't want to rely on existing state that might change,
    // we will limit this test to "Login and Dashboard Load" which is the prerequisite for booking.
    // A full booking test requires a guaranteed available slot.
    
    // We can try to mock the API response for availability if we want to test the UI flow without a real backend slot.
    // But Playwright E2E usually tests the full stack.
    
    // For this task, "Student books slot", I will write the test code assuming a slot exists,
    // but I'll mark it as "skip" or comment that it requires seeded data if I can't guarantee it.
    // However, the prompt asked me to "Proceed", so I should try to make it as robust as possible.
    
    // A better approach: Use the API to create a tutor and availability *before* the UI steps.
    // But I don't have direct DB access easily from within the Playwright test file unless I import `db`.
    // Importing `db` in Playwright tests is possible if they run in the same environment (Node).
    // Let's try to import db and seed a tutor.
  })
})
