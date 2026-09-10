import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
} from "@playwright/test";

import { test as base, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

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
const ZAP_HAR_PATH = process.env.E2E_ZAP_HAR_PATH;
const CONTEXT_OPTIONS: BrowserContextOptions = {
  baseURL: BASE_URL,
  ignoreHTTPSErrors: true,
};
const ZAP_HAR_OPTIONS: BrowserContextOptions =
  ZAP_HAR_PATH === undefined
    ? {}
    : {
        recordHar: {
          content: "embed",
          mode: "full",
          path: ZAP_HAR_PATH,
        },
      };

export const createBrowserContext = async (
  browser: Browser,
  options: BrowserContextOptions = {},
): Promise<BrowserContext> =>
  await browser.newContext({
    ...CONTEXT_OPTIONS,
    ...options,
  });

interface Har {
  log: { entries: HarEntry[] };
}

interface HarEntry {
  response: { status: number };
}

// A status of 0 (Chromium's marker for an aborted/cancelled request) makes ZAP's
// HAR importer fail the whole import, not just skip the offending entry.
const ABORTED_REQUEST_STATUS = 0;

const removeInvalidHarEntries = async (harPath: string): Promise<void> => {
  const parsedHar: unknown = JSON.parse(await readFile(harPath, "utf-8"));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- shape is produced by Playwright's own recordHar, not user input
  const har = parsedHar as Har;
  har.log.entries = har.log.entries.filter(
    (entry) => entry.response.status > ABORTED_REQUEST_STATUS,
  );
  await writeFile(harPath, JSON.stringify(har));
};

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
    const context = await createBrowserContext(browser, {
      ...(authStorageState === undefined
        ? {}
        : { storageState: authStorageState }),
      ...ZAP_HAR_OPTIONS,
    });

    await use(context);
    await context.close();

    if (ZAP_HAR_PATH !== undefined) {
      await removeInvalidHarEntries(ZAP_HAR_PATH);
    }
  },

  page: async ({ context }, use): Promise<void> => {
    const page = await context.newPage();
    await page.goto("/");
    await use(page);
  },
});

export type { Actor };
export { createActor, expect };
