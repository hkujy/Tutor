import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests/agents',
    testMatch: 'vercel-comprehensive-scenarios.spec.ts',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: 'list',
    timeout: 120000,

    use: {
        baseURL: 'https://tutor-sandy.vercel.app',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
})
