import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

import {
  extractApplicationIdFromTaskListPath,
  taskListUrlPattern,
} from "./task-list.flow.js";

const clickContinue = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: "Continue" }).click();
};

export const startNewCase = async (page: Page): Promise<void> => {
  await page.goto("/cases/new/provider-declaration");
};

export const completeCreateCaseShortestPath = async (
  page: Page,
): Promise<string> => {
  await startNewCase(page);
  await page.getByRole("button", { name: "Agree and continue" }).click();

  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("User");
  await page.getByLabel("Day").fill("01");
  await page.getByLabel("Month").fill("01");
  await page.getByLabel("Year").fill("1990");
  await clickContinue(page);

  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  await page.getByRole("radio", { name: "Yes" }).check();
  await clickContinue(page);

  await page.getByLabel("Address line 1").fill("1 Test Street");
  await page.getByLabel("Town or city").fill("Testtown");
  await page.getByLabel("Postcode").fill("SW1A 1AA");
  await clickContinue(page);

  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(taskListUrlPattern());

  const applicationId = extractApplicationIdFromTaskListPath(
    new URL(page.url()).pathname,
  );

  if (applicationId === undefined) {
    throw new Error("Failed to extract application ID from task-list URL");
  }

  return applicationId;
};
