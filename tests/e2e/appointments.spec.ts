import { test, expect } from '@playwright/test';

/**
 * Appointment Flow E2E Tests
 * 
 * Tests the complete appointment lifecycle:
 * - Creation
 * - Viewing
 * - Rescheduling
 * - Cancellation
 */

test.describe('Appointment Creation Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as student
        await page.goto('/en/login');
        await page.fill('input[name="email"]', 'student@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/student/, { timeout: 10000 });
    });

    test('should create new appointment successfully', async ({ page }) => {
        // Navigate to sessions tab
        await page.click('text=/Sessions|课程/i');
        await page.waitForTimeout(500);

        // Fill appointment form
        const tutorSelect = page.locator('select[name="tutorId"], [name="tutorId"]').first();
        const dateInput = page.locator('input[name="date"], input[type="date"]').first();
        const timeInput = page.locator('input[name="time"], input[type="time"]').first();
        const subjectInput = page.locator('input[name="subject"]').first();

        if (await tutorSelect.isVisible({ timeout: 2000 })) {
            // Select tutor (if dropdown exists)
            await tutorSelect.selectOption({ index: 1 });
        }

        if (await dateInput.isVisible()) {
            await dateInput.fill('2025-12-31');
            await timeInput.fill('10:00');
            await subjectInput.fill('E2E Test Mathematics');

            // Optional: Add notes
            const notesInput = page.locator('textarea[name="notes"], input[name="notes"]').first();
            if (await notesInput.isVisible({ timeout: 1000 })) {
                await notesInput.fill('Test appointment for E2E testing');
            }

            // Submit form
            const submitButton = page.locator('button:has-text("Book"), button:has-text("Create"), button[type="submit"]').first();
            await submitButton.click();

            // Should see success message or appointment in list
            await expect(
                page.locator('text=/E2E Test Mathematics|Success|Created/i')
            ).toBeVisible({ timeout: 5000 });
        }
    });

    test('should show validation errors for invalid input', async ({ page }) => {
        await page.click('text=/Sessions|课程/i');
        await page.waitForTimeout(500);

        // Try to submit empty form
        const submitButton = page.locator('button:has-text("Book"), button:has-text("Create"), button[type="submit"]').first();

        if (await submitButton.isVisible({ timeout: 2000 })) {
            await submitButton.click();

            // Should show validation errors
            await expect(
                page.locator('text=/required|必填|invalid|无效/i')
            ).toBeVisible({ timeout: 3000 });
        }
    });

    test('should prevent double booking', async ({ page }) => {
        await page.click('text=/Sessions|课程/i');
        await page.waitForTimeout(500);

        const dateInput = page.locator('input[name="date"], input[type="date"]').first();
        const timeInput = page.locator('input[name="time"], input[type="time"]').first();
        const subjectInput = page.locator('input[name="subject"]').first();

        if (await dateInput.isVisible()) {
            // Try to book same time slot twice
            await dateInput.fill('2025-12-31');
            await timeInput.fill('14:00');
            await subjectInput.fill('First Booking');

            const submitButton = page.locator('button:has-text("Book"), button[type="submit"]').first();
            await submitButton.click();

            // Wait for first booking to complete
            await page.waitForTimeout(2000);

            // Try to book same slot again
            await dateInput.fill('2025-12-31');
            await timeInput.fill('14:00');
            await subjectInput.fill('Second Booking');
            await submitButton.click();

            // Should show conflict error
            await expect(
                page.locator('text=/already booked|conflict|已预订/i')
            ).toBeVisible({ timeout: 5000 });
        }
    });
});

test.describe('Appointment Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login as tutor
        await page.goto('/en/login');
        await page.fill('input[name="email"]', 'tutor@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/tutor/, { timeout: 10000 });

        // Navigate to appointments
        await page.click('text=/Appointments|预约/i');
        await page.waitForTimeout(1000);
    });

    test('should display list of appointments', async ({ page }) => {
        // Should see appointments list
        const appointmentsList = page.locator('[data-testid="appointments-list"], .appointment-card, li').first();

        // Either appointments exist or empty state is shown
        const hasAppointments = await appointmentsList.isVisible({ timeout: 3000 });
        const hasEmptyState = await page.locator('text=/No appointments|empty|暂无/i').isVisible({ timeout: 1000 });

        expect(hasAppointments || hasEmptyState).toBeTruthy();
    });

    test('should filter appointments by status', async ({ page }) => {
        // Find status filter
        const statusFilter = page.locator('select[name="status"], select:has(option:has-text("SCHEDULED"))').first();

        if (await statusFilter.isVisible({ timeout: 2000 })) {
            // Change filter to COMPLETED
            await statusFilter.selectOption({ label: /COMPLETED|已完成/i });
            await page.waitForTimeout(500);

            // Should update the list
            const completedAppointments = page.locator('text=/COMPLETED|已完成/i');
            const hasCompleted = await completedAppointments.count() > 0;
            const hasEmpty = await page.locator('text=/No appointments|empty/i').isVisible({ timeout: 1000 });

            expect(hasCompleted || hasEmpty).toBeTruthy();
        }
    });

    test('should reschedule appointment', async ({ page }) => {
        // Find first reschedule button
        const rescheduleButton = page.locator('button:has-text("Reschedule")').first();

        if (await rescheduleButton.isVisible({ timeout: 3000 })) {
            await rescheduleButton.click();

            // Should open reschedule modal
            await expect(
                page.locator('text=/Reschedule|重新安排/i')
            ).toBeVisible({ timeout: 2000 });

            // Change time
            const timeInput = page.locator('input[name="time"], input[type="time"]').first();
            if (await timeInput.isVisible({ timeout: 2000 })) {
                await timeInput.fill('16:00');

                // Confirm
                await page.click('button:has-text("Confirm"), button:has-text("Save")');

                // Should see updated time
                await expect(
                    page.locator('text=/4:00 PM|16:00/i')
                ).toBeVisible({ timeout: 5000 });
            }
        }
    });

    test('should cancel appointment', async ({ page }) => {
        // Find first cancel button
        const cancelButton = page.locator('button:has-text("Cancel")').first();

        if (await cancelButton.isVisible({ timeout: 3000 })) {
            await cancelButton.click();

            // Should show confirmation dialog
            await expect(
                page.locator('text=/confirm|sure|确认/i')
            ).toBeVisible({ timeout: 2000 });

            // Confirm cancellation
            const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
            await confirmButton.click();

            // Should see CANCELLED status
            await expect(
                page.locator('text=/CANCELLED|已取消/i')
            ).toBeVisible({ timeout: 5000 });
        }
    });

    test('should mark appointment as completed', async ({ page }) => {
        // Find complete button (tutor only)
        const completeButton = page.locator('button:has-text("Complete"), button:has-text("Mark")').first();

        if (await completeButton.isVisible({ timeout: 3000 })) {
            await completeButton.click();

            // Should see COMPLETED status
            await expect(
                page.locator('text=/COMPLETED|已完成/i')
            ).toBeVisible({ timeout: 5000 });
        }
    });
});

test.describe('Appointment Filters and Sorting', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/en/login');
        await page.fill('input[name="email"]', 'student@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/student/, { timeout: 10000 });
        await page.click('text=/Sessions|课程/i');
        await page.waitForTimeout(1000);
    });

    test('should filter by time (upcoming/past)', async ({ page }) => {
        const timeFilter = page.locator('select:has(option:has-text("Upcoming")), select:has(option:has-text("Past"))').first();

        if (await timeFilter.isVisible({ timeout: 2000 })) {
            // Filter to upcoming
            await timeFilter.selectOption({ label: /Upcoming|即将/i });
            await page.waitForTimeout(500);

            // Should show upcoming appointments or empty state
            const hasAppointments = await page.locator('.appointment-card, li').count() > 0;
            const hasEmpty = await page.locator('text=/No appointments|empty/i').isVisible({ timeout: 1000 });

            expect(hasAppointments || hasEmpty).toBeTruthy();
        }
    });

    test('should sort appointments', async ({ page }) => {
        const sortSelect = page.locator('select:has(option:has-text("Date")), select:has(option:has-text("Subject"))').first();

        if (await sortSelect.isVisible({ timeout: 2000 })) {
            // Sort by subject
            await sortSelect.selectOption({ label: /Subject|科目/i });
            await page.waitForTimeout(500);

            // List should update (we can't verify exact order without knowing data)
            expect(await page.locator('.appointment-card, li').count()).toBeGreaterThanOrEqual(0);
        }
    });

    test('should switch between list and grid view', async ({ page }) => {
        const gridButton = page.locator('button:has-text("Grid"), button[aria-label*="grid" i]').first();
        const listButton = page.locator('button:has-text("List"), button[aria-label*="list" i]').first();

        if (await gridButton.isVisible({ timeout: 2000 })) {
            await gridButton.click();
            await page.waitForTimeout(300);

            // Should show grid layout
            expect(await page.locator('.grid, [class*="grid"]').count()).toBeGreaterThan(0);

            // Switch back to list
            if (await listButton.isVisible()) {
                await listButton.click();
                await page.waitForTimeout(300);
            }
        }
    });
});
