import { test, expect } from "../../fixtures/index.js";

test("select office flow", async ({ page }) => {
  // Navigate to the select office page
  await page.goto("/select-office");

  // Check the page heading
  await expect(
    page.getByRole("group", {
      name: "Select the office you're recording cases from",
    }),
  ).toBeVisible();

  // Select the first office and submit
  const radios = page.getByRole("radio");
  await radios.first().check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the landing page after selecting an office
  await expect(page).toHaveURL("/");

  // Verify the landing page is shown
  await expect(
    page.getByRole("heading", { name: "Landing Page", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Record a new case" }),
  ).toBeVisible();
});