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

  // Check for the question on the evidence of income page
  await expect(
    page.getByRole("heading", {
      name: /Do you have evidence of your client's income\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Select "Wage slips" and "Bank statements" and submit
  await page.getByRole("checkbox", { name: "Wage slips" }).check();
  await page.getByRole("checkbox", { name: "Bank statements" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the evidence of expenditure and capital page
  await expect(page).toHaveURL("/cases/evidence/evidence-of-expenditure-and-capital");

  // Navigate back to the has evidence page
  await page.goto("/cases/evidence/have-evidence");

  // Select "No" and submit
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the reason for no evidence page
  await expect(page).toHaveURL("/cases/evidence/reason-for-no-evidence");

  // check for questions on reason for no evidence page
  await expect(
    page.getByRole("heading", {
      name: /What's the reason for not having evidence\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Select "It's not possible to get it before starting the work" and submit
  await page.getByRole("radio", { name: "It's not possible to get it before starting the work" }).check();
  await page.getByRole("textbox", { name: "Give more details" }).fill("Some details about why I don't have evidence.");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the check your answers page
  await expect(page).toHaveURL("/cases/evidence/check-answers");
});
