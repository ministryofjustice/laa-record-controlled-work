import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
} from "@playwright/test";

import { test as base, expect } from "@playwright/test";

import {
  type Actor,
  type ActorFixtures,
  createActor,
} from "#tests/e2e/fixtures/actor.fixture.js";
import { AUTH_MODE, signInWithMockOAuth } from "#tests/e2e/flows/auth.flow.js";

interface HarnessFixtures extends ActorFixtures {}

interface HarnessWorkerFixtures {
  authStorageState?: BrowserContextOptions["storageState"];
}

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const AUTH_STORAGE_STATE_PATH = process.env.E2E_AUTH_STORAGE_STATE_PATH;
const CONTEXT_OPTIONS: BrowserContextOptions = {
  baseURL: BASE_URL,
  ignoreHTTPSErrors: true,
};

export const createBrowserContext = async (
  browser: Browser,
  options: BrowserContextOptions = {},
): Promise<BrowserContext> =>
  await browser.newContext({
    ...CONTEXT_OPTIONS,
    ...options,
  });

export const test = base.extend<HarnessFixtures, HarnessWorkerFixtures>({
  actor: async ({ page }, use): Promise<void> => {
    await use(createActor(page));
  },

  authStorageState: [
    async ({ browser }, use): Promise<void> => {
      if (AUTH_STORAGE_STATE_PATH !== undefined) {
        await use(AUTH_STORAGE_STATE_PATH);
        return;
      }

      if (AUTH_MODE !== "mock") {
        await use(undefined);
        return;
      }

      const authContext = await createBrowserContext(browser);
      const authPage = await authContext.newPage();

      await signInWithMockOAuth(authPage);

      const storageState = await authContext.storageState();
      await authContext.close();

      await use(storageState);
    },
    { scope: "worker" },
  ],

  context: async ({ authStorageState, browser }, use): Promise<void> => {
    const context = await createBrowserContext(
      browser,
      authStorageState === undefined ? {} : { storageState: authStorageState },
    );

    await use(context);
    await context.close();
  },

  page: async ({ context }, use): Promise<void> => {
    const page = await context.newPage();
    await page.goto("/");
    await use(page);
  },
});

export type { Actor };
export { createActor, expect };
