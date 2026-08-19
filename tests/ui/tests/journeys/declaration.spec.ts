import { test, expect } from "../../fixtures/index.js";
import { application } from "../../msw/fixtures/rcw.fixtures.js";

test("Client Declaration - Client Declaration step", async ({
  withSelectedOffice: page,
}) => {
  const applicationId = application.id;

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

test("Client Declaration - Client Declaration step", async ({
  withSelectedOffice: page,
}) => {
  const applicationId = application.id;

  // ==========================================================================
  // Client Declaration page
  // ==========================================================================

  await page.goto(`/cases/${applicationId}/declaration/sign`);

  await expect(
    page.getByRole("heading", {
      name: "Sign the declaration",
      level: 1,
    }),
  ).toBeVisible();

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
  await expect(page).toHaveURL(`/cases/${applicationId}/declaration/confirm/`);

  await page.goto(`/cases/${applicationId}/declaration/sign`);

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(`/cases/${applicationId}/declaration/ufn`);
});
