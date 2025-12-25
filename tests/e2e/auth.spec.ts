import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Start from the home page
        await page.goto('/en');
    });

    test('should display login page', async ({ page }) => {
        await page.goto('/en/login');

        // Check for login form elements
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/en/login');

        // Fill in invalid credentials
        await page.fill('input[name="email"]', 'invalid@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');

        // Submit form
        await page.click('button[type="submit"]');

        // Should show error message (wait for it to appear)
        await expect(page.locator('text=/Invalid credentials|Error|incorrect/i')).toBeVisible({ timeout: 5000 });
    });

    test('should login with valid credentials', async ({ page }) => {
        await page.goto('/en/login');

        // Fill in valid credentials (using test account)
        await page.fill('input[name="email"]', 'tutor@example.com');
        await page.fill('input[name="password"]', 'password123');

        // Submit form
        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL(/\/(tutor|student)/, { timeout: 10000 });
    });

    test('should navigate to registration page', async ({ page }) => {
        await page.goto('/en/login');

        // Click register link
        await page.click('text=/Register|Sign up|Create account/i');

        // Should be on register page
        await expect(page).toHaveURL(/\/register/);
    });

    test('should switch language', async ({ page }) => {
        await page.goto('/en/login');

        // Find and click language switcher
        const languageSwitcher = page.locator('[data-testid="language-switcher"], button:has-text("EN"), button:has-text("English")').first();

        if (await languageSwitcher.isVisible()) {
            await languageSwitcher.click();

            // Click Chinese option
            await page.click('text=/中文|Chinese|ZH/i');

            // URL should change to /zh
            await expect(page).toHaveURL(/\/zh\//);
        }
    });
});

test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route', async ({ page }) => {
        // Try to access tutor dashboard without authentication
        await page.goto('/en/tutor');

        // Should redirect to login
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });

    test('should redirect to login when accessing student dashboard', async ({ page }) => {
        // Try to access student dashboard without authentication
        await page.goto('/en/student');

        // Should redirect to login
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });
});
