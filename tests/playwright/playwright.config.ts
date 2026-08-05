import { defineConfig, devices } from "@playwright/test";

export const ENTRA_TEST_CONFIG = {
  ENTRA_CLIENT_ID: "00000000-0000-0000-0000-000000000001",
  ENTRA_CLIENT_SECRET: "test-client-secret",
  ENTRA_TENANT_ID: "test-tenant-id",
  ENTRA_AUTHORITY_BASE_URL: "https://login.microsoftonline.com/",
  ENTRA_REDIRECT_URI: "http://localhost:3001/auth/code/callback",
};

/**
 * Configuration values for MSW handlers
 */
export const MSW_CONFIG = {
  RCW_API_BASE_URL: "https://test.cloud-platform.service.justice.gov.uk",
  API_PREFIX: "/latest/mock",
};

/**
 * Test configuration values
 */
export const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || "http://localhost:3001",
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
    command:
      process.env.CI === "true"
        ? "yarn tsx scripts/test-server-with-msw.ts"
        : "yarn build && yarn tsx scripts/test-server-with-msw.ts",
    url: "http://127.0.0.1:3001/health",
    reuseExistingServer: process.env.CI !== "true",
    stdout: "pipe",
    stderr: "pipe",
    timeout: 60000,
    cwd: "../..", // Run from project root since config is now in tests/playwright/ subdirectory
    env: {
      NODE_ENV: "test",
      PORT: "3001",
      PLAYWRIGHT_TEST_SIGNIN: "true",
      SESSION_SECRET: "test-secret-key-for-playwright-tests",
      SERVICE_NAME: "Record civil controlled work",
      DEPARTMENT_NAME: "Legal Aid Agency",
      SERVICE_PHASE: "Beta",
      PDA_API_KEY: "test-api-key",

      // Fake but valid-format Entra credentials for tests.
      // MSAL validates these are HTTPS URIs at startup — op:// references
      // from .env are resolved by 1Password in dev but not in tests.
      ENTRA_CLIENT_ID: ENTRA_TEST_CONFIG.ENTRA_CLIENT_ID,
      ENTRA_CLIENT_SECRET: ENTRA_TEST_CONFIG.ENTRA_CLIENT_SECRET,
      ENTRA_TENANT_ID: ENTRA_TEST_CONFIG.ENTRA_TENANT_ID,
      ENTRA_AUTHORITY_BASE_URL: ENTRA_TEST_CONFIG.ENTRA_AUTHORITY_BASE_URL,
      ENTRA_REDIRECT_URI: ENTRA_TEST_CONFIG.ENTRA_REDIRECT_URI,
      REDIS_ENABLED: "false",
      // Configure Axios to ignore proxies
      // SLSA uses safe-chain which proxies package managers
      // and sets HTTPS_PROXY on the environment, which breaks
      // tests.
      NO_PROXY: "*",
    },
  },
});
