import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
    test('should load homepage', async ({ page }) => {
        await page.goto('/en');

        // Should see the app title
        await expect(page.locator('h1, text=/Tutoring Calendar/i')).toBeVisible();
    });

    test('should redirect root to /en', async ({ page }) => {
        await page.goto('/');

        // Should redirect to /en
        await expect(page).toHaveURL(/\/en/);
    });
});

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Login as tutor for navigation tests
        await page.goto('/en/login');
        await page.fill('input[name="email"]', 'tutor@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Wait for dashboard to load
        await expect(page).toHaveURL(/\/tutor/, { timeout: 10000 });
    });

    test('should navigate between tabs', async ({ page }) => {
        // Click on different tabs
        const tabs = ['Dashboard', 'Students', 'Availability', 'Appointments'];

        for (const tabName of tabs) {
            const tab = page.locator(`button:has-text("${tabName}"), a:has-text("${tabName}")`).first();

            if (await tab.isVisible()) {
                await tab.click();
                await page.waitForTimeout(500); // Wait for tab content to load
            }
        }
    });

    test('should open notification bell', async ({ page }) => {
        // Find notification bell
        const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification" i]').first();

        if (await notificationBell.isVisible()) {
            await notificationBell.click();

            // Should show notification popover
            await expect(page.locator('text=/Notifications|No notifications/i')).toBeVisible();
        }
    });

    test('should open user menu', async ({ page }) => {
        // Find user menu button
        const userMenu = page.locator('[data-testid="user-menu"], button[aria-label*="user" i], button:has-text("Settings")').first();

        if (await userMenu.isVisible()) {
            await userMenu.click();

            // Should show menu options
            await expect(page.locator('text=/Logout|Sign out|Settings/i')).toBeVisible();
        }
    });
});

test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto('/en/login');

        // Form should still be visible and usable
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });

        await page.goto('/en/login');

        // Form should be visible
        await expect(page.locator('input[name="email"]')).toBeVisible();
    });
});
