import type { BrowserContext, Page } from "@playwright/test";

import {
  createBrowserContext,
  createActor,
  type Actor,
  expect,
  test,
} from "#tests/e2e/playwright.harness.js";

test.describe("@e2e Family Law public path", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;
  let actor: Actor;
  let applicationId: string;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await createBrowserContext(browser);
    page = await context.newPage();
    actor = createActor(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("User can complete the create application journey with the Family Law (public) path", async () => {
    await actor.login();
    await actor.selectOfficeByCode("R1XEVG");
    await actor.completeCreateApplicationWithFamilyLawPublicPath();
  });
});
