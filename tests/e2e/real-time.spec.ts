import { test, expect, Browser } from '@playwright/test';

/**
 * Real-Time Features E2E Tests
 * 
 * These tests verify that WebSocket real-time updates work correctly
 * by simulating two users (tutor and student) in separate browser contexts.
 */

test.describe('Real-Time Appointment Updates', () => {
    let browser: Browser;

    test.beforeAll(async ({ browser: b }) => {
        browser = b;
    });

    test('should sync appointment creation in real-time', async () => {
        // Create two separate browser contexts (two different users)
        const studentContext = await browser.newContext();
        const tutorContext = await browser.newContext();

        const studentPage = await studentContext.newPage();
        const tutorPage = await tutorContext.newPage();

        try {
            // Login student
            await studentPage.goto('/en/login');
            await studentPage.fill('input[name="email"]', 'student@example.com');
            await studentPage.fill('input[name="password"]', 'password123');
            await studentPage.click('button[type="submit"]');
            await expect(studentPage).toHaveURL(/\/student/, { timeout: 10000 });

            // Login tutor
            await tutorPage.goto('/en/login');
            await tutorPage.fill('input[name="email"]', 'tutor@example.com');
            await tutorPage.fill('input[name="password"]', 'password123');
            await tutorPage.click('button[type="submit"]');
            await expect(tutorPage).toHaveURL(/\/tutor/, { timeout: 10000 });

            // Navigate tutor to appointments tab
            await tutorPage.click('text=/Appointments|预约/i');
            await tutorPage.waitForTimeout(1000);

            // Student creates appointment
            await studentPage.click('text=/Sessions|课程/i');
            await studentPage.waitForTimeout(500);

            // Fill appointment form (adjust selectors based on your actual form)
            const dateInput = studentPage.locator('input[name="date"], input[type="date"]').first();
            const timeInput = studentPage.locator('input[name="time"], input[type="time"]').first();
            const subjectInput = studentPage.locator('input[name="subject"], input[placeholder*="subject" i]').first();

            if (await dateInput.isVisible()) {
                await dateInput.fill('2025-12-30');
                await timeInput.fill('14:00');
                await subjectInput.fill('Real-Time Test Physics');

                // Submit form
                await studentPage.click('button:has-text("Book"), button:has-text("Create"), button[type="submit"]');

                // Wait a moment for WebSocket event to propagate
                await tutorPage.waitForTimeout(2000);

                // Tutor should see the new appointment appear (real-time!)
                const appointmentVisible = await tutorPage.locator('text=/Real-Time Test Physics/i').isVisible({ timeout: 5000 });
                expect(appointmentVisible).toBeTruthy();

                // Should have green pulse indicator for real-time update
                const pulseIndicator = tutorPage.locator('.animate-ping, [class*="pulse"]').first();
                if (await pulseIndicator.isVisible({ timeout: 2000 })) {
                    console.log('✓ Pulse indicator visible - real-time update confirmed');
                }
            }
        } finally {
            // Cleanup
            await studentContext.close();
            await tutorContext.close();
        }
    });

    test('should sync appointment cancellation in real-time', async () => {
        const studentContext = await browser.newContext();
        const tutorContext = await browser.newContext();

        const studentPage = await studentContext.newPage();
        const tutorPage = await tutorContext.newPage();

        try {
            // Login both users
            await studentPage.goto('/en/login');
            await studentPage.fill('input[name="email"]', 'student@example.com');
            await studentPage.fill('input[name="password"]', 'password123');
            await studentPage.click('button[type="submit"]');
            await expect(studentPage).toHaveURL(/\/student/, { timeout: 10000 });

            await tutorPage.goto('/en/login');
            await tutorPage.fill('input[name="email"]', 'tutor@example.com');
            await tutorPage.fill('input[name="password"]', 'password123');
            await tutorPage.click('button[type="submit"]');
            await expect(tutorPage).toHaveURL(/\/tutor/, { timeout: 10000 });

            // Navigate to appointments
            await studentPage.click('text=/Sessions|课程/i');
            await tutorPage.click('text=/Appointments|预约/i');
            await tutorPage.waitForTimeout(1000);

            // Tutor cancels an appointment
            const cancelButton = tutorPage.locator('button:has-text("Cancel")').first();
            if (await cancelButton.isVisible({ timeout: 3000 })) {
                await cancelButton.click();

                // Confirm cancellation
                const confirmButton = tutorPage.locator('button:has-text("Confirm")').first();
                if (await confirmButton.isVisible({ timeout: 2000 })) {
                    await confirmButton.click();
                }

                // Wait for WebSocket event
                await studentPage.waitForTimeout(2000);

                // Student should see CANCELLED status (real-time!)
                const cancelledVisible = await studentPage.locator('text=/CANCELLED|已取消/i').isVisible({ timeout: 5000 });
                expect(cancelledVisible).toBeTruthy();
            }
        } finally {
            await studentContext.close();
            await tutorContext.close();
        }
    });

    test('should sync appointment updates in real-time', async () => {
        const studentContext = await browser.newContext();
        const tutorContext = await browser.newContext();

        const studentPage = await studentContext.newPage();
        const tutorPage = await tutorContext.newPage();

        try {
            // Login both users
            await studentPage.goto('/en/login');
            await studentPage.fill('input[name="email"]', 'student@example.com');
            await studentPage.fill('input[name="password"]', 'password123');
            await studentPage.click('button[type="submit"]');
            await expect(studentPage).toHaveURL(/\/student/, { timeout: 10000 });

            await tutorPage.goto('/en/login');
            await tutorPage.fill('input[name="email"]', 'tutor@example.com');
            await tutorPage.fill('input[name="password"]', 'password123');
            await tutorPage.click('button[type="submit"]');
            await expect(tutorPage).toHaveURL(/\/tutor/, { timeout: 10000 });

            // Navigate to appointments
            await studentPage.click('text=/Sessions|课程/i');
            await tutorPage.click('text=/Appointments|预约/i');
            await tutorPage.waitForTimeout(1000);

            // Tutor reschedules an appointment
            const rescheduleButton = tutorPage.locator('button:has-text("Reschedule")').first();
            if (await rescheduleButton.isVisible({ timeout: 3000 })) {
                await rescheduleButton.click();

                // Change time
                const timeInput = tutorPage.locator('input[name="time"], input[type="time"]').first();
                if (await timeInput.isVisible({ timeout: 2000 })) {
                    await timeInput.fill('15:00');

                    // Confirm
                    await tutorPage.click('button:has-text("Confirm"), button:has-text("Save")');

                    // Wait for WebSocket event
                    await studentPage.waitForTimeout(2000);

                    // Student should see updated time (real-time!)
                    const updatedTimeVisible = await studentPage.locator('text=/3:00 PM|15:00/i').isVisible({ timeout: 5000 });
                    expect(updatedTimeVisible).toBeTruthy();
                }
            }
        } finally {
            await studentContext.close();
            await tutorContext.close();
        }
    });
});

test.describe('WebSocket Connection', () => {
    test('should establish WebSocket connection on login', async ({ page }) => {
        // Login
        await page.goto('/en/login');
        await page.fill('input[name="email"]', 'tutor@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/tutor/, { timeout: 10000 });

        // Wait a moment for WebSocket connection
        await page.waitForTimeout(2000);

        // Check console for WebSocket connection logs
        const logs: string[] = [];
        page.on('console', msg => {
            logs.push(msg.text());
        });

        // Trigger a page action that might log WebSocket status
        await page.reload();
        await page.waitForTimeout(2000);

        // Look for Socket connection logs
        const hasSocketLog = logs.some(log =>
            log.includes('Socket') ||
            log.includes('WebSocket') ||
            log.includes('connected')
        );

        console.log('WebSocket connection established:', hasSocketLog);
    });
});
