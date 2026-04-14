import { test, expect } from "../fixtures/index.js";

test("landing page should have the correct title", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/landing");

  // Check for the title of the application
  await expect(page).toHaveTitle(/Test Express Template – GOV.UK/);
});

test("landing page should display LAA header", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/landing");

  // Check for the header with LAA branding
  const header = page.locator(".govuk-header");
  await expect(header).toBeVisible();

  // Check for GOV.UK branding which is typically in the header
  await expect(page.getByRole("link", { name: "GOV.UK" })).toBeVisible();
});

test("landing page should display Landing page title", async ({
  page,
  signIn,
}) => {
  await signIn();
  await page.goto("/landing");

  // Check for Landing Page title
  await expect(
    page.getByRole("heading", { name: "Landing Page", level: 1 }),
  ).toBeVisible();
});
