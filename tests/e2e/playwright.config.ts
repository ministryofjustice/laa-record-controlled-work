import { defineConfig, devices } from "@playwright/test";

type E2EAuthMode = "entra" | "mock";

const CI_RETRIES = 2;
const CI_WORKERS = 2;
const LOCAL_RETRIES = 0;

const resolveAuthMode = (): E2EAuthMode => {
  const authMode = (process.env.E2E_AUTH_MODE ?? "mock").toLowerCase();

  if (authMode === "mock" || authMode === "entra") {
    return authMode;
  }

  throw new Error(
    `Unsupported E2E_AUTH_MODE '${authMode}'. Expected 'mock' or 'entra'.`,
  );
};

export const E2E_CONFIG = {
  AUTH_MODE: resolveAuthMode(),
  BASE_URL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
};

export default defineConfig({
  forbidOnly: Boolean(process.env.CI ?? false),
  fullyParallel: false,
  grep: new RegExp("@e2e"),
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: "html",
  retries: process.env.CI === "true" ? CI_RETRIES : LOCAL_RETRIES,
  testDir: "./specs",
  use: {
    baseURL: E2E_CONFIG.BASE_URL,
    ignoreHTTPSErrors: true,
    trace: process.env.CI === "true" ? "on" : "on-first-retry",
  },
  workers: process.env.CI === "true" ? CI_WORKERS : undefined,
});
