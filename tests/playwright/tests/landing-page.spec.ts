import { test, expect } from "../fixtures/index.js";

test("landing page should have the correct title", async ({ page }) => {
  await page.goto("/");

  // Check for the title of the application
  await expect(page).toHaveTitle(/Record civil controlled work – GOV.UK/);
});

test("landing page should display Landing page title", async ({ page }) => {
  await page.goto("/");

  // Check for Landing Page title
  await expect(
    page.getByRole("heading", { name: "Stub Landing Page", level: 1 }),
  ).toBeVisible();
});
