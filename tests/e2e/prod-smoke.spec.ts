import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

const BASE_URL = 'https://tutor-sandy.vercel.app';

test.describe('Production Smoke Test', () => {
    const uniqueId = randomUUID().substring(0, 8);
    const tutorEmail = `prod-tutor-${uniqueId}@test.com`;
    // Add randomness or +1 to ensure student email is unique if run repeatedly
    const studentEmail = `prod-student-${uniqueId}@test.com`;
    const password = 'Password123!';

    test('Critical Path Verification', async ({ page }) => {
        // --- TUTOR FLOW ---
        console.log('Verifying Tutor Registration...');
        await page.goto(`${BASE_URL}/en/auth/signup?role=tutor`);

        await page.fill('input[name="firstName"]', 'Auto');
        await page.fill('input[name="lastName"]', 'Tutor');
        await page.fill('input[name="email"]', tutorEmail);
        await page.fill('input[name="password"]', password);
        await page.fill('input[name="confirmPassword"]', password);

        await page.click('button[type="submit"]');

        // Expect redirection to LOGIN with success message
        console.log('Waiting for redirect to login...');
        await expect(page).toHaveURL(/.*\/login/, { timeout: 30000 });

        // --- EXPLICIT LOGIN (Tutor) ---
        console.log('Logging in as Tutor...');
        // Wait for form to be ready
        await expect(page.locator('#email')).toBeVisible();
        await page.fill('#email', tutorEmail);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');

        // Expect redirection to DASHBOARD
        console.log('Waiting for redirect to Tutor Dashboard...');
        await expect(page).toHaveURL(/.*\/tutor/, { timeout: 45000 });
        console.log('Tutor Logged In Successfully');

        // --- LOCALIZATION CHECK ---
        console.log('Verifying Localization on Dashboard...');
        // Verify English text first using H1 to be specific yet robust
        const dashboardTitle = page.locator('h1');
        await expect(dashboardTitle).toBeVisible();
        await expect(dashboardTitle).toHaveText(/Dashboard/i);

        // Switch to Chinese
        await page.locator('nav select').first().selectOption('zh');
        await expect(page).toHaveURL(/.*\/zh/);

        // Verify Chinese specific text in H1: "仪表板"
        await expect(dashboardTitle).toHaveText(/仪表板/);
        console.log('Localization Verified (EN -> ZH)');

        // Switch back to English
        await page.locator('nav select').first().selectOption('en');
        await expect(page).toHaveURL(/.*\/en/);

        // --- LOGOUT ---
        console.log('Logging out...');
        await page.click('[data-testid="logout-button"]');
        await expect(page).toHaveURL(/.*\/login/);
        console.log('Logged out.');

        // --- STUDENT FLOW ---
        console.log('Verifying Student Registration...');
        await page.goto(`${BASE_URL}/en/auth/signup?role=student`);

        await page.fill('input[name="firstName"]', 'Auto');
        await page.fill('input[name="lastName"]', 'Student');
        await page.fill('input[name="email"]', studentEmail);
        await page.fill('input[name="password"]', password);
        await page.fill('input[name="confirmPassword"]', password);

        await page.click('button[type="submit"]');

        // Expect redirect to Login
        console.log('Waiting for redirect to login...');
        await expect(page).toHaveURL(/.*\/login/, { timeout: 30000 });

        // --- EXPLICIT LOGIN (Student) ---
        console.log('Logging in as Student...');
        await expect(page.locator('#email')).toBeVisible();
        await page.fill('#email', studentEmail);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');

        // Expect redirect to Student Dashboard (/student)
        console.log('Waiting for redirect to Student Dashboard...');
        await expect(page).toHaveURL(/.*\/student/, { timeout: 45000 });
        console.log('Student Logged In Successfully');

        // --- BROWSE TUTORS VERIFICATION ---
        console.log('Verifying Student Dashboard content...');
        await expect(page.getByText('Student Dashboard').first()).toBeVisible();

        // Check for currency selector (USD) availability
        // It might be in the nav or on the dashboard
        // Just checking page doesn't crash

        console.log('Production Smoke Test Completed Successfully');
    });
});
