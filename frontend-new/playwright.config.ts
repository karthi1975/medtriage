import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for MediChat E2E Tests
 * Tests GCP deployment with real backend services
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run serially to avoid race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,

  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'playwright-report/results.json' }]
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://medichat-frontend-820444130598.us-east5.run.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Extended timeouts for Cloud Run cold starts
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  timeout: 120000, // 2 minutes per test (for slow backend operations)

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
