import { test, expect } from '@playwright/test';

test.describe('Profile Management Feature', () => {

    test('Student can view and update profile', async ({ page }) => {
        // Login as student
        await page.goto('http://localhost:3000/en/login');

        // Verify no Quick Demo Login buttons exist
        await expect(page.getByText('Quick Demo Login')).not.toBeVisible();
        await expect(page.getByText('Demo Credentials')).not.toBeVisible();

        // Manual login
        await page.fill('#email', 'student@example.com');
        await page.fill('#password', 'student123');
        await page.click('button[type="submit"]');

        // Wait for redirect to student dashboard
        await page.waitForURL('**/student');

        // Navigate to Settings tab
        await page.click('button:has-text("Settings"), button:has-text("设置")');

        // Verify Personal Information section exists
        await expect(page.getByText('Personal Information')).toBeVisible();

        // Check form fields are present
        await expect(page.locator('#firstName')).toBeVisible();
        await expect(page.locator('#lastName')).toBeVisible();
        await expect(page.locator('#phone')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#email')).toBeDisabled();

        // Get current values
        const currentFirstName = await page.locator('#firstName').inputValue();
        const currentLastName = await page.locator('#lastName').inputValue();

        console.log(`Current student name: ${currentFirstName} ${currentLastName}`);

        // Update phone number
        await page.fill('#phone', '+1 (555) 123-4567');

        // Save changes
        await page.click('button:has-text("Save Changes")');

        // Wait for success message or page reload
        await page.waitForTimeout(2000);

        console.log('✅ Student profile test completed');
    });

    test('Tutor can view and update profile', async ({ page }) => {
        // Login as tutor
        await page.goto('http://localhost:3000/en/login');

        // Verify no Quick Demo Login buttons exist
        await expect(page.getByText('Quick Demo Login')).not.toBeVisible();

        // Manual login
        await page.fill('#email', 'tutor@example.com');
        await page.fill('#password', 'tutor123');
        await page.click('button[type="submit"]');

        // Wait for redirect to tutor dashboard
        await page.waitForURL('**/tutor');

        // Navigate to Settings tab
        await page.click('button:has-text("Settings"), button:has-text("设置")');

        // Verify Personal Information section exists
        await expect(page.getByText('Personal Information')).toBeVisible();

        // Check form fields are present
        await expect(page.locator('#firstName')).toBeVisible();
        await expect(page.locator('#lastName')).toBeVisible();
        await expect(page.locator('#phone')).toBeVisible();

        // Get current values
        const currentFirstName = await page.locator('#firstName').inputValue();
        const currentLastName = await page.locator('#lastName').inputValue();

        console.log(`Current tutor name: ${currentFirstName} ${currentLastName}`);

        // Update phone number
        await page.fill('#phone', '+1 (555) 987-6543');

        // Save changes
        await page.click('button:has-text("Save Changes")');

        // Wait for success message or page reload
        await page.waitForTimeout(2000);

        console.log('✅ Tutor profile test completed');
    });

    test('Login page has no demo login functionality', async ({ page }) => {
        await page.goto('http://localhost:3000/en/login');

        // Verify Quick Demo Login is completely removed
        await expect(page.getByText('Quick Demo Login')).not.toBeVisible();
        await expect(page.getByText('Tutor', { exact: false }).filter({ has: page.getByText('Sarah Johnson') })).not.toBeVisible();
        await expect(page.getByText('Student', { exact: false }).filter({ has: page.getByText('Alex Smith') })).not.toBeVisible();
        await expect(page.getByText('Demo Credentials')).not.toBeVisible();
        await expect(page.getByText('tutor@example.com / tutor123')).not.toBeVisible();

        // Verify manual login form exists
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

        console.log('✅ Login page verification completed');
    });
});
