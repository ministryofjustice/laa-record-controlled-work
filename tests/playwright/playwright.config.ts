import { defineConfig, devices } from "@playwright/test";

export const ENTRA_TEST_CONFIG = {
  CLIENT_ID: "00000000-0000-0000-0000-000000000001",
  CLIENT_SECRET: "test-client-secret",
  TENANT_ID: "test-tenant-id",
  CLOUD_INSTANCE: "https://login.microsoftonline.com/",
  REDIRECT_URI: "http://localhost:3000/auth/redirect",
  POST_LOGOUT_REDIRECT_URI: "http://localhost:3000/",
};

/**
 * Configuration values for MSW handlers
 */
export const MSW_CONFIG = {
  API_BASE_URL: "https://test.cloud-platform.service.justice.gov.uk",
  API_PREFIX: "/latest/mock",
};

/**
 * Test configuration values
 */
export const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || "http://localhost:3000",
};

/**
 * Playwright configuration
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI ?? false),
  retries: process.env.CI === "true" ? 2 : 0,
  workers: process.env.CI === "true" ? 5 : undefined,
  reporter: "html",
  use: {
    baseURL: TEST_CONFIG.BASE_URL,
    trace: process.env.CI === "true" ? "on" : "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "yarn tsx scripts/test-server-with-msw.ts",
    url: "http://127.0.0.1:3000/health",
    reuseExistingServer: process.env.CI !== "true",
    stdout: "pipe",
    stderr: "pipe",
    timeout: 60000,
    cwd: "../..", // Run from project root since config is now in tests/playwright/ subdirectory
    env: {
      NODE_ENV: "test",
      PLAYWRIGHT_TEST_SIGNIN: "true",
      PORT: "3000",
      SESSION_SECRET: "test-secret-key-for-playwright-tests",
      SESSION_NAME: "test-session",
      SERVICE_NAME: "Test Express Template",

      // Fake but valid-format Entra credentials for tests.
      // MSAL validates these are HTTPS URIs at startup — op:// references
      // from .env are resolved by 1Password in dev but not in tests.
      CLIENT_ID: ENTRA_TEST_CONFIG.CLIENT_ID,
      CLIENT_SECRET: ENTRA_TEST_CONFIG.CLIENT_SECRET,
      TENANT_ID: ENTRA_TEST_CONFIG.TENANT_ID,
      CLOUD_INSTANCE: ENTRA_TEST_CONFIG.CLOUD_INSTANCE,
      REDIRECT_URI: ENTRA_TEST_CONFIG.REDIRECT_URI,
      POST_LOGOUT_REDIRECT_URI: ENTRA_TEST_CONFIG.POST_LOGOUT_REDIRECT_URI,

      // Configure Axios to ignore proxies
      // SLSA uses safe-chain which proxies package managers
      // and sets HTTPS_PROXY on the environment, which breaks
      // tests.
      NO_PROXY: "*",
    },
  },
});
