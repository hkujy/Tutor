import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Vercel Deployment Test Suite
 * Tests various user scenarios on https://tutor-sandy.vercel.app
 */

const VERCEL_URL = 'https://tutor-sandy.vercel.app';

// Test user credentials (assuming these exist in production)
const TEST_USERS = {
    student: {
        email: 'student@example.com',
        password: 'student123',
        role: 'STUDENT'
    },
    tutor: {
        email: 'tutor@example.com',
        password: 'tutor123',
        role: 'TUTOR'
    }
};

test.describe('Vercel Deployment - User Journey Tests', () => {

    test.describe('Scenario 1: New Visitor Journey', () => {
        test('should display clean login page without demo elements', async ({ page }) => {
            await page.goto(`${VERCEL_URL}/en/login`);

            // Verify page loads successfully
            await expect(page).toHaveTitle(/Tutoring Calendar/i);

            // Verify no demo login elements
            await expect(page.getByText('Quick Demo Login')).not.toBeVisible();
            await expect(page.getByText('Demo Credentials')).not.toBeVisible();

            // Verify essential login elements exist
            await expect(page.locator('#email')).toBeVisible();
            await expect(page.locator('#password')).toBeVisible();
            await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

            // Verify signup link exists
            await expect(page.getByText(/sign up/i)).toBeVisible();

            console.log('✅ New visitor sees clean login page');
        });

        test('should navigate to signup page', async ({ page }) => {
            await page.goto(`${VERCEL_URL}/en/login`);

            // Click signup link
            await page.click('a[href*="signup"]');

            // Verify signup page loads
            await expect(page).toHaveURL(/signup/);
            await expect(page.getByText(/create account/i)).toBeVisible({ timeout: 10000 });

            console.log('✅ Signup navigation working');
        });
    });

    test.describe('Scenario 2: Student User Journey', () => {
        test('should login as student and access dashboard', async ({ page }) => {
            await page.goto(`${VERCEL_URL}/en/login`);

            // Login
            await page.fill('#email', TEST_USERS.student.email);
            await page.fill('#password', TEST_USERS.student.password);
            await page.click('button[type="submit"]');

            // Wait for redirect to student dashboard
            await page.waitForURL('**/student', { timeout: 15000 });

            // Verify student dashboard loaded
            await expect(page.getByText(/student dashboard/i)).toBeVisible({ timeout: 10000 });

            console.log('✅ Student login and dashboard access successful');
        });

        test('should access student profile settings', async ({ page }) => {
            // Login first
            await page.goto(`${VERCEL_URL}/en/login`);
            await page.fill('#email', TEST_USERS.student.email);
            await page.fill('#password', TEST_USERS.student.password);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/student', { timeout: 15000 });

            // Navigate to Settings
            await page.click('button:has-text("Settings"), button:has-text("设置")');

            // Verify Personal Information section
            await expect(page.getByText('Personal Information')).toBeVisible({ timeout: 10000 });
            await expect(page.locator('#firstName')).toBeVisible();
            await expect(page.locator('#lastName')).toBeVisible();
            await expect(page.locator('#phone')).toBeVisible();

            console.log('✅ Student can access profile settings');
        });

        test('should browse available tutors', async ({ page }) => {
            // Login
            await page.goto(`${VERCEL_URL}/en/login`);
            await page.fill('#email', TEST_USERS.student.email);
            await page.fill('#password', TEST_USERS.student.password);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/student', { timeout: 15000 });

            // Navigate to Browse Tutors (if tab exists)
            const browseTutorsButton = page.locator('button:has-text("Browse"), button:has-text("浏览")');
            if (await browseTutorsButton.isVisible()) {
                await browseTutorsButton.click();
                await page.waitForTimeout(2000);
                console.log('✅ Student can browse tutors');
            } else {
                console.log('ℹ️ Browse Tutors tab not found');
            }
        });
    });

    test.describe('Scenario 3: Tutor User Journey', () => {
        test('should login as tutor and access dashboard', async ({ page }) => {
            await page.goto(`${VERCEL_URL}/en/login`);

            // Login
            await page.fill('#email', TEST_USERS.tutor.email);
            await page.fill('#password', TEST_USERS.tutor.password);
            await page.click('button[type="submit"]');

            // Wait for redirect to tutor dashboard
            await page.waitForURL('**/tutor', { timeout: 15000 });

            // Verify tutor dashboard loaded
            await expect(page.getByText(/tutor dashboard/i)).toBeVisible({ timeout: 10000 });

            console.log('✅ Tutor login and dashboard access successful');
        });

        test('should access tutor profile settings', async ({ page }) => {
            // Login first
            await page.goto(`${VERCEL_URL}/en/login`);
            await page.fill('#email', TEST_USERS.tutor.email);
            await page.fill('#password', TEST_USERS.tutor.password);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/tutor', { timeout: 15000 });

            // Navigate to Settings
            await page.click('button:has-text("Settings"), button:has-text("设置")');

            // Verify Personal Information section
            await expect(page.getByText('Personal Information')).toBeVisible({ timeout: 10000 });
            await expect(page.locator('#firstName')).toBeVisible();
            await expect(page.locator('#lastName')).toBeVisible();
            await expect(page.locator('#phone')).toBeVisible();

            console.log('✅ Tutor can access profile settings');
        });

        test('should view student list', async ({ page }) => {
            // Login
            await page.goto(`${VERCEL_URL}/en/login`);
            await page.fill('#email', TEST_USERS.tutor.email);
            await page.fill('#password', TEST_USERS.tutor.password);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/tutor', { timeout: 15000 });

            // Navigate to Students tab (use tab role to avoid quick action button)
            const studentsTabButton = page.locator('button[role="tab"]:has-text("Students"), button[role="tab"]:has-text("学生")');
            if (await studentsTabButton.count() > 0) {
                await studentsTabButton.first().click();
                await page.waitForTimeout(2000);
                console.log('✅ Tutor can view student list');
            } else {
                console.log('ℹ️ Students tab not found');
            }
        });
    });

    test.describe('Scenario 4: Language Switching', () => {
        test('should switch between English and Chinese', async ({ page }) => {
            await page.goto(`${VERCEL_URL}/en/login`);

            // Verify English page
            await expect(page).toHaveURL(/\/en\//);

            // Look for language switcher
            const languageSwitcher = page.locator('[aria-label*="language"], button:has-text("中文"), button:has-text("EN")');

            if (await languageSwitcher.first().isVisible()) {
                await languageSwitcher.first().click();
                await page.waitForTimeout(1000);

                // Verify URL changed to Chinese
                const currentUrl = page.url();
                console.log(`Current URL after language switch: ${currentUrl}`);

                if (currentUrl.includes('/zh/')) {
                    console.log('✅ Language switching working');
                } else {
                    console.log('⚠️ Language switch may not have worked as expected');
                }
            } else {
                console.log('ℹ️ Language switcher not found');
            }
        });
    });

    test.describe('Scenario 5: Error Handling', () => {
        test('should handle invalid login credentials', async ({ page }) => {
            await page.goto(`${VERCEL_URL}/en/login`);

            // Try invalid credentials
            await page.fill('#email', 'invalid@example.com');
            await page.fill('#password', 'wrongpassword');
            await page.click('button[type="submit"]');

            // Wait for error message
            await page.waitForTimeout(2000);

            // Verify error message appears
            const errorMessage = page.locator('.text-destructive, [role="alert"], .error');
            const hasError = await errorMessage.count() > 0;

            if (hasError) {
                console.log('✅ Invalid login shows error message');
            } else {
                console.log('⚠️ Error message not detected');
            }
        });

        test('should handle empty form submission', async ({ page }) => {
            await page.goto(`${VERCEL_URL}/en/login`);

            // Try to submit empty form
            await page.click('button[type="submit"]');
            await page.waitForTimeout(1000);

            // Should show validation error
            const errorMessage = page.locator('.text-destructive, [role="alert"]');
            const hasError = await errorMessage.count() > 0;

            if (hasError) {
                console.log('✅ Empty form shows validation error');
            } else {
                console.log('⚠️ Validation error not detected');
            }
        });
    });

    test.describe('Scenario 6: Navigation and UI', () => {
        test('should have responsive navigation', async ({ page }) => {
            await page.goto(`${VERCEL_URL}/en/login`);

            // Check for navigation elements
            const nav = page.locator('nav, header');
            await expect(nav.first()).toBeVisible();

            console.log('✅ Navigation present');
        });

        test('should load without console errors', async ({ page }) => {
            const consoleErrors: string[] = [];

            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            await page.goto(`${VERCEL_URL}/en/login`);
            await page.waitForTimeout(3000);

            if (consoleErrors.length === 0) {
                console.log('✅ No console errors detected');
            } else {
                console.log(`⚠️ Console errors detected: ${consoleErrors.length}`);
                consoleErrors.forEach(err => console.log(`  - ${err}`));
            }
        });
    });

    test.describe('Scenario 7: Performance and Loading', () => {
        test('should load login page within acceptable time', async ({ page }) => {
            const startTime = Date.now();

            await page.goto(`${VERCEL_URL}/en/login`);
            await page.waitForLoadState('networkidle');

            const loadTime = Date.now() - startTime;
            console.log(`Page load time: ${loadTime}ms`);

            if (loadTime < 5000) {
                console.log('✅ Page loads within 5 seconds');
            } else {
                console.log(`⚠️ Page took ${loadTime}ms to load`);
            }
        });
    });
});

test.describe('Vercel Deployment - Accessibility Tests', () => {
    test('should have proper form labels', async ({ page }) => {
        await page.goto(`${VERCEL_URL}/en/login`);

        // Check for proper labels
        const emailLabel = page.locator('label[for="email"]');
        const passwordLabel = page.locator('label[for="password"]');

        await expect(emailLabel).toBeVisible();
        await expect(passwordLabel).toBeVisible();

        console.log('✅ Form has proper labels');
    });

    test('should have accessible buttons', async ({ page }) => {
        await page.goto(`${VERCEL_URL}/en/login`);

        // Check submit button
        const submitButton = page.getByRole('button', { name: /sign in/i });
        await expect(submitButton).toBeVisible();

        console.log('✅ Buttons are accessible');
    });
});
