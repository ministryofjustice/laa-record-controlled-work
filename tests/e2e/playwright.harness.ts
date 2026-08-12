import type { BrowserContext } from "@playwright/test";

import { test as base, expect } from "@playwright/test";

import {
  type ActorFixtures,
  createActor,
  type E2EActor,
} from "./fixtures/actor.fixture.js";
import { signInWithMockOAuth } from "./flows/auth.flow.js";

const AUTH_MODE = (process.env.E2E_AUTH_MODE ?? "mock").toLowerCase();

interface HarnessFixtures extends ActorFixtures {}

interface HarnessWorkerFixtures {
  authStorageState: Awaited<ReturnType<BrowserContext["storageState"]>>;
}

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

const assertMockAuthMode = (): void => {
  if (AUTH_MODE !== "mock") {
    throw new Error(
      "Unsupported E2E_AUTH_MODE " +
        `'${AUTH_MODE}' in playwright harness. ` +
        "Only 'mock' is implemented for Phase 2.",
    );
  }
};

export const test = base.extend<HarnessFixtures, HarnessWorkerFixtures>({
  actor: async ({ page }, use): Promise<void> => {
    await use(createActor(page));
  },

  authStorageState: [
    async ({ browser }, use): Promise<void> => {
      assertMockAuthMode();

      const authContext = await browser.newContext({
        baseURL: BASE_URL,
        ignoreHTTPSErrors: true,
      });
      const authPage = await authContext.newPage();

      await signInWithMockOAuth(authPage);

      const storageState = await authContext.storageState();
      await authContext.close();

      await use(storageState);
    },
    { scope: "worker" },
  ],

  context: async ({ authStorageState, browser }, use): Promise<void> => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      ignoreHTTPSErrors: true,
      storageState: authStorageState,
    });

    await use(context);
    await context.close();
  },

  page: async ({ context }, use): Promise<void> => {
    const page = await context.newPage();
    await page.goto("/");
    await use(page);
  },
});

export type { E2EActor };
export { createActor, expect };
