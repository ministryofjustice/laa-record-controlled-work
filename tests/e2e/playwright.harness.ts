import type { Page } from "@playwright/test";

import { test as base, expect } from "@playwright/test";

import {
  type ActorFixtures,
  createActor,
  type E2EActor,
} from "./fixtures/actor.fixture.js";
import { signInWithMockOAuth } from "./flows/auth.flow.js";
import { ensureOfficeSelected } from "./flows/office.flow.js";

const AUTH_MODE = (process.env.E2E_AUTH_MODE ?? "mock").toLowerCase();

interface HarnessFixtures extends ActorFixtures {
  withSelectedOffice: Page;
}

export const test = base.extend<HarnessFixtures>({
  actor: async ({ page }, use): Promise<void> => {
    await use(createActor(page));
  },

  page: async ({ page }, use): Promise<void> => {
    if (AUTH_MODE !== "mock") {
      throw new Error(
        "Unsupported E2E_AUTH_MODE " +
          `'${AUTH_MODE}' in playwright harness. ` +
          "Only 'mock' is implemented for Phase 2.",
      );
    }

    await signInWithMockOAuth(page);
    await use(page);
  },

  withSelectedOffice: async ({ page }, use): Promise<void> => {
    await ensureOfficeSelected(page);
    await use(page);
  },
});

export type { E2EActor };
export { createActor, expect };
