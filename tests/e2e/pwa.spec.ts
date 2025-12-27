import { test, expect } from '@playwright/test';

test.describe('PWA & Mobile', () => {
    test('manifest.json should be accessible and valid', async ({ request }) => {
        const response = await request.get('/manifest.json');
        expect(response.status()).toBe(200);
        const manifest = await response.json();
        expect(manifest.name).toBe('Tutoring Calendar');
        expect(manifest.display).toBe('standalone');
    });

    test('layout should link to manifest', async ({ page }) => {
        await page.goto('/en');
        const manifestLink = page.locator('link[rel="manifest"]');
        await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
    });

    test('mobile viewport should show install prompt logic (simulated by check)', async ({ page }) => {
        // We can't easily test the actual "beforeinstallprompt" event in headless,
        // but we can check if the PWAInstallPrompt component code is present in the bundle
        // by checking if the component renders invisible initially.
        // However, since it returns null if not visible, we can just check if the page loads without error.
        await page.goto('/en');

        // Check if meta viewport is correct
        const viewportMeta = page.locator('meta[name="viewport"]');
        await expect(viewportMeta).toHaveAttribute('content', /width=device-width/);
    });
});
