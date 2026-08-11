import type { Page } from "@playwright/test";

import {
  createActor,
  type E2EActor,
  expect,
  test,
} from "../../playwright.harness.js";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

test.describe("@e2e critical path", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;
  let actor: E2EActor;
  let applicationId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      ignoreHTTPSErrors: true,
    });
    page = await context.newPage();
    actor = createActor(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("logs in", async () => {
    await actor.login();
    await expect(page).toHaveURL(/\/(select-office|cases)\/?/);
  });

  test("selects office", async () => {
    await actor.ensureOfficeSelected();
    await expect(page).toHaveURL(/\/cases\/?$/);
  });

  test("creates new application", async () => {
    applicationId = await actor.completeCreateCaseShortestPath();
    await expect(page).toHaveURL(
      new RegExp(`/cases/${applicationId}/task-list/?$`),
    );
  });

  test("application appears in case list as in progress", async () => {
    await actor.assertInProgressCaseVisible("Test User");
  });

  test("completes eligibility assessment", async () => {
    await actor.completeCcqShortestEligiblePath(applicationId);
    await expect(page).toHaveURL(
      new RegExp(`/cases/${applicationId}/task-list/?$`),
    );
    await actor.assertTaskStatus("Income and capital", "Completed");
  });

  test.fixme("completes evidence section", async () => {});
  test.fixme("completes declaration", async () => {});
  test.fixme("submits application", async () => {});
  test.fixme("checks recorded cases", async () => {});
  test.fixme("exports case", async () => {});
});
