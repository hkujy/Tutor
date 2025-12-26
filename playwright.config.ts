import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },

    /* Multi-Agent Tests - Run separately with longer timeouts */
    {
      name: 'multi-agent-basic',
      testDir: './tests/agents',
      testMatch: '**/multi-agent-basic.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Longer timeout for agent tests
        actionTimeout: 15000,
        navigationTimeout: 15000,
      },
      timeout: 60000, // 60s per test
    },
    {
      name: 'multi-agent-concurrent',
      testDir: './tests/agents',
      testMatch: '**/multi-agent-concurrent.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        actionTimeout: 15000,
        navigationTimeout: 15000,
      },
      timeout: 120000, // 120s for heavy concurrent tests
      workers: 1, // Run sequentially to avoid resource conflicts
    },
    {
      name: 'production-simulation',
      testDir: './tests/agents',
      testMatch: '**/vercel-simulation.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://tutor-sandy.vercel.app/',
        actionTimeout: 20000,
        navigationTimeout: 20000,
      },
      timeout: 180000, // 3 minutes for production tests
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})