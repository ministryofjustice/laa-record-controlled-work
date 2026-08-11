import { test, expect } from "../../fixtures/index.js";

test("Client Declaration - Client Declaration step", async ({ page }) => {
  // ==========================================================================
  // Client Declaration page
  // ==========================================================================

  await page.goto("/cases/new/declaration/confirm");

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
  await expect(page).toHaveURL("/cases/new/task-list");

  await page.goto("/cases/new/declaration/confirm");

  await page.getByRole("button", { name: "Confirm and continue" }).click();
  await expect(page).toHaveURL("/cases/new/declaration/sign");
});
