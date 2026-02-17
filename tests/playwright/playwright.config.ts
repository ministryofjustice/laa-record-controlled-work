import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration values for MSW handlers
 */
export const MSW_CONFIG = {
  API_BASE_URL: 'https://test.cloud-platform.service.justice.gov.uk',
  API_PREFIX: '/latest/mock'
};

/**
 * Test configuration values
 */
export const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000'
};

/**
 * Playwright configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI ?? false),
  retries: process.env.CI === 'true' ? 2 : 0,
  workers: process.env.CI === 'true' ? 5 : undefined,
  reporter: 'html',
  use: {
    baseURL: TEST_CONFIG.BASE_URL,
    trace: process.env.CI === 'true' ? 'on' : 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'yarn tsx scripts/test-server-with-msw.js',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: process.env.CI !== 'true',
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 60000,
    cwd: '../..', // Run from project root since config is now in tests/playwright/ subdirectory
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      SESSION_SECRET: 'test-secret-key-for-playwright-tests',
      SESSION_NAME: 'test-session',
      SERVICE_NAME: 'Test Express Template'
    }
  },
});

