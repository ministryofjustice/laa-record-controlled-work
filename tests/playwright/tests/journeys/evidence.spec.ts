import { test, expect } from "../../fixtures/index.js";

test("evidence flow", async ({ page }) => {
  await page.goto("/cases/evidence/have-evidence");

  // Check for the question
  await expect(
    page.getByRole("heading", {
      name: /Do you have evidence of your client's financial eligibility\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Select "Yes" and submit
  await page.getByRole("radio", { name: "Yes" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the evidence of income page
  await expect(page).toHaveURL("/cases/evidence/evidence-of-income");

  // Navigate back to the has evidence page
  await page.goto("/cases/evidence/have-evidence");

  // Select "No" and submit
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the reason for no evidence page
  await expect(page).toHaveURL("/cases/evidence/reason-for-no-evidence");
});
