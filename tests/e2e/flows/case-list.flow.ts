import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

import {
  extractApplicationIdFromTaskListPath,
  isTaskListPath,
} from "#tests/e2e/flows/task-list.flow.js";

export const CASE_LIST_URL_PATTERN = new RegExp("/cases$");

export const isCaseListPath = (pathname: string): boolean =>
  pathname === "/cases";

export const gotoCaseList = async (page: Page): Promise<void> => {
  await page.goto("/cases");
  await expect
    .poll(() => isCaseListPath(new URL(page.url()).pathname))
    .toBe(true);
};

export const gotoCase = async (
  page: Page,
  applicationId: string,
): Promise<void> => {
  await page.goto(`/cases/${applicationId}/task-list`);
  await expect
    .poll(() => isTaskListPath(new URL(page.url()).pathname, applicationId))
    .toBe(true);
};

export const assertInProgressCaseVisible = async (
  page: Page,
  clientName: string,
): Promise<void> => {
  await gotoCaseList(page);
  await page.getByRole("link", { name: "In progress" }).click();
  await expect(
    page.getByRole("cell", { name: clientName }).first(),
  ).toBeVisible();
};

export const openDraftCaseFromCaseList = async (
  page: Page,
  applicationId: string,
): Promise<string> => {
  await gotoCaseList(page);
  await page.getByRole("link", { name: "In progress" }).click();

  const draftCaseLink = page
    .locator(`a[href='/cases/${applicationId}/task-list']`)
    .first();

  await expect(draftCaseLink).toBeVisible();
  await draftCaseLink.click();

  const openedApplicationId = extractApplicationIdFromTaskListPath(
    new URL(page.url()).pathname,
  );

  if (openedApplicationId === undefined) {
    throw new Error("Failed to extract application ID from task-list URL");
  }

  return openedApplicationId;
};
