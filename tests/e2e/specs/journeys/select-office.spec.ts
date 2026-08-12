import type { BrowserContext, Page } from "@playwright/test";

import {
  createBrowserContext,
  expect,
  test,
} from "#tests/e2e/playwright.harness.js";
import {
  signInWithMultiOffice,
  signInWithSingleOffice,
} from "#tests/e2e/flows/auth.flow.js";
import { CASE_LIST_URL_PATTERN } from "#tests/e2e/flows/case-list.flow.js";
import { completeCreateCaseShortestPath } from "#tests/e2e/flows/create-case.flow.js";
import { selectOfficeByCode } from "#tests/e2e/flows/office.flow.js";

const SELECT_OFFICE_URL_PATTERN = new RegExp("/select-office/?$");
const LANDING_URL_PATTERN = new RegExp("/$");
const OFFICE_ONE_CODE = "R1XEVG";
const OFFICE_TWO_CODE = "VGHVEY";

const gotoInProgressCases = async (page: Page): Promise<void> => {
  await page.goto("/cases");
  await page.getByRole("link", { name: "In progress" }).click();
  await expect(page).toHaveURL(CASE_LIST_URL_PATTERN);
};

test.describe("@e2e single office user", () => {
  test.describe.configure({ mode: "serial" });

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await createBrowserContext(browser);
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test(
    "is redirected to landing page on sign in",
    async () => {
      await signInWithSingleOffice(page, OFFICE_ONE_CODE);
      await expect(page).toHaveURL(LANDING_URL_PATTERN);
    },
  );
});

test.describe("@e2e multi office user", () => {
  test.describe.configure({ mode: "serial" });

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await createBrowserContext(browser);
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test(
    "is redirected to landing page on sign in",
    async () => {
      await signInWithMultiOffice(page, [OFFICE_ONE_CODE, OFFICE_TWO_CODE]);
      await expect(page).toHaveURL(SELECT_OFFICE_URL_PATTERN);
    },
  );

  test(
    "can change office and is redirected to the landing page",
    async () => {
      await signInWithMultiOffice(page, [OFFICE_ONE_CODE, OFFICE_TWO_CODE]);
      await selectOfficeByCode(page, OFFICE_ONE_CODE);

      await page.getByRole("link", { name: "Change" }).click();
      await expect(page).toHaveURL(SELECT_OFFICE_URL_PATTERN);

      await selectOfficeByCode(page, OFFICE_TWO_CODE);
      await expect(page).toHaveURL(CASE_LIST_URL_PATTERN);
      await expect(page.locator("p", { hasText: "Office:" })).toContainText(
        OFFICE_TWO_CODE,
      );
    },
  );

  test(
    "can only see cases for the selected office after changing offices",
    async () => {
      await signInWithMultiOffice(page, [OFFICE_ONE_CODE, OFFICE_TWO_CODE]);
      await selectOfficeByCode(page, OFFICE_ONE_CODE);
      const officeOneApplicationId = await completeCreateCaseShortestPath(page);

      await page.goto("/cases");
      await page.getByRole("link", { name: "Change" }).click();
      await selectOfficeByCode(page, OFFICE_TWO_CODE);
      const officeTwoApplicationId = await completeCreateCaseShortestPath(page);

      await gotoInProgressCases(page);
      await expect(
        page.locator(`a[href='/cases/${officeTwoApplicationId}/task-list']`).first(),
      ).toBeVisible();
      await expect(
        page.locator(`a[href='/cases/${officeOneApplicationId}/task-list']`),
      ).toHaveCount(0);

      await page.getByRole("link", { name: "Change" }).click();
      await selectOfficeByCode(page, OFFICE_ONE_CODE);

      await gotoInProgressCases(page);
      await expect(
        page.locator(`a[href='/cases/${officeOneApplicationId}/task-list']`).first(),
      ).toBeVisible();
      await expect(
        page.locator(`a[href='/cases/${officeTwoApplicationId}/task-list']`),
      ).toHaveCount(0);
    },
  );
});


