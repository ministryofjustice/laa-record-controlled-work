import type { BrowserContext, Page } from "@playwright/test";

import {
  createBrowserContext,
  createActor,
  type Actor,
  expect,
  test,
} from "#tests/e2e/playwright.harness.js";
import { CASE_LIST_URL_PATTERN } from "#tests/e2e/flows/case-list.flow.js";
import { taskListUrlPattern } from "#tests/e2e/flows/task-list.flow.js";

const ROOT_OR_ENTRY_URL_PATTERN = new RegExp("/$|/(select-office|cases)$");

test.describe("@e2e critical path", () => {
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

  test("login directs user to select office flow", async () => {
    await actor.login();
    await expect(page).toHaveURL(ROOT_OR_ENTRY_URL_PATTERN);
  });

  test("user selects office", async () => {
    await actor.selectOfficeByCode("R1XEVG");
    await expect(page).toHaveURL(CASE_LIST_URL_PATTERN);
  });

  test("user creates a new application", async () => {
    applicationId = await actor.completeCreateCaseShortestPath();
    await expect(page).toHaveURL(taskListUrlPattern(applicationId));
  });

  test("application appears in case list as draft", async () => {
    await actor.gotoCaseList();
    await actor.assertInProgressCaseVisible("Test User");
  });

  test("user navigates to draft case and completes eligibility assessment", async () => {
    applicationId = await actor.openDraftCaseFromCaseList(applicationId);
    await actor.openMeansAssessmentFromTaskList(applicationId);

    await actor.completeCcqShortestEligiblePath(applicationId);

    await expect(page).toHaveURL(taskListUrlPattern(applicationId));
    await actor.assertTaskStatus("Income and capital", "Completed");
  });

  test("user views the completed eligibility assessment result", async () => {
    await actor.assertEligibilityResultVisible();

    await actor.viewCompletedEligibilityAssessment(applicationId);
    await actor.returnToTaskListFromEligibilityResult(applicationId);
  });

  test.fixme("completes evidence section", async () => {});
  test.fixme("completes declaration", async () => {});

  test.fixme("submits application", async () => {
    // TODO started scaffolding this test, it requires other journeys to be complete first
    await actor.submitApplication(applicationId);
    await expect(page).toHaveURL(/\/submittedPage-TODO/);
  });

  test.fixme("checks recorded cases", async () => {});
  test.fixme("exports case", async () => {});
});
