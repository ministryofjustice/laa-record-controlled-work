import { test, expect } from "../../fixtures/index.js";
import { completeApplication } from "../../msw/fixtures/rcw.fixtures.js";

test("Client Declaration - Client Declaration step", async ({
  withSelectedOffice: page,
}) => {
  const applicationId = completeApplication.id;

  // ==========================================================================
  // Client Declaration page
  // ==========================================================================

  await page.goto(`/cases/${applicationId}/declaration/confirm`);

  await expect(
    page.getByRole("heading", {
      name: "Confirm the following",
      level: 1,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: "Confirm and continue",
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: "Save and return later",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Save and return" }).click();
  await expect(page).toHaveURL(`/cases/${applicationId}/task-list/`);

  await page.goto(`/cases/${applicationId}/declaration/confirm`);

  await page.getByRole("button", { name: "Confirm and continue" }).click();
  await expect(page).toHaveURL(`/cases/${applicationId}/declaration/sign`);
});

test("Client Declaration - Sign Declaration step", async ({
  withSelectedOffice: page,
}) => {
  const applicationId = completeApplication.id;

  // ==========================================================================
  // Sign Declaration page
  // ==========================================================================

  await page.goto(`/cases/${applicationId}/declaration/confirm`);
  await page.getByRole("button", { name: "Confirm and continue" }).click();
  await expect(page).toHaveURL(`/cases/${applicationId}/declaration/sign`);

  await expect(
    page.getByRole("heading", {
      name: "Sign the declaration",
      level: 1,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("checkbox", {
      name: "I confirm that I have a signed declaration from my client",
    }),
  ).toBeVisible();

  await expect(page.getByRole("textbox", { name: "Day" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Month" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Year" })).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: "Continue",
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: "Save and return later",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Save and return" }).click();
  await expect(page).toHaveURL(`/cases/${applicationId}/task-list`);

  await page.goto(`/cases/${applicationId}/declaration/sign`);

  await page
    .getByRole("checkbox", {
      name: "I confirm that I have a signed declaration from my client",
    })
    .check();
  await page.getByRole("textbox", { name: "Day" }).fill("1");
  await page.getByRole("textbox", { name: "Month" }).fill("2");
  await page.getByRole("textbox", { name: "Year" }).fill("2026");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(`/cases/${applicationId}/declaration/ufn`);

  // ==========================================================================
  // UFN Declaration page
  // ==========================================================================

  await expect(page).toHaveURL(`/cases/${applicationId}/declaration/ufn`);

  await expect(
    page.getByRole("heading", {
      name: "What is the unique file number (UFN) for this case?",
      level: 1,
    }),
  ).toBeVisible();

  await page
    .getByRole("textbox", {
      name: "What is the unique file number (UFN) for this case?",
    })
    .fill("123456");
  await page.getByRole("button", { name: "Continue" }).click();

  // ==========================================================================
  // Check answers page
  // ==========================================================================

  await expect(page).toHaveURL(
    `/cases/${applicationId}/declaration/check-answers`,
  );

  await expect(
    page.getByRole("heading", {
      name: "Check your answers",
      level: 1,
    }),
  ).toBeVisible();

  // Check that all answers are displayed correctly
  const summaryList = page.locator(".govuk-summary-list");
  const rows = summaryList.locator(".govuk-summary-list__row");
  await expect(rows).toHaveCount(2);
  await expect(rows.locator(".govuk-summary-list__value")).toHaveText(
    [
      // Sign date
      "1 February 2026",
      // UFN
      "123456",
    ],
    { useInnerText: true },
  );
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page).toHaveURL(`/cases/${applicationId}/task-list`);
});
