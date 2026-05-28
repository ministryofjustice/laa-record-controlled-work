import { test, expect } from "../../fixtures/index.js";

test("create application flow", async ({ page }) => {
  // Test for ECF page
  
  // Navigate to the ECF page
  await page.goto("/create-application/ecf");

  // Check for the question
  await expect(
    page.getByRole("heading", {
      name: /Does this case require Exceptional Case Funding\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Check for the radio options
  const yesOption = page.locator('input[type="radio"][value="yes"]');
  const noOption = page.locator('input[type="radio"][value="no"]');
  await expect(yesOption).toBeVisible();
  await expect(noOption).toBeVisible();

  // Check for the validation message when no option is selected
  await page.click('button[type="submit"]');
  await expect(page.locator(".govuk-error-message")).toHaveText(
    /Please select an option/,
  );

  // Select "Yes" and submit
  await yesOption.check();
  await page.click('button[type="submit"]');
  // Verify redirection to the ECF dropout page
  await expect(page).toHaveURL("/create-application/ecf-dropout");

  // Navigate back to the ECF page
  await page.goto("/create-application/ecf");

  // Select "No" and submit
  await noOption.check();
  await page.click('button[type="submit"]');
  // Verify redirection to the legal aid before page
  await expect(page).toHaveURL("/create-application/legal-aid-before");

  // Test for legal aid before page

  // Check for the question
  await expect(
    page.getByRole("heading", {
      name: /Has your client accessed legal aid before\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Check for the radio options
  const yesSameMatterOption = page.locator(
    'input[type="radio"][value="yesSameMatter"]',
  );
  const yesDifferentMatterOption = page.locator(
    'input[type="radio"][value="yesDifferentMatter"]',
  );
  const noMatterOption = page.locator('input[type="radio"][value="no"]');
  await expect(yesSameMatterOption).toBeVisible();
  await expect(yesDifferentMatterOption).toBeVisible();
  await expect(noMatterOption).toBeVisible();
  
  // Check for the validation message when no option is selected
  await page.click('button[type="submit"]');
  await expect(page.locator(".govuk-error-message")).toHaveText(
    /Please select an option/,
  );

  // Select "Yes, about the same matter" and submit
  await yesSameMatterOption.check();
  await page.click('button[type="submit"]');
  // Verify redirection to the legal aid before 6 months page
  await expect(page).toHaveURL("/create-application/legal-aid-last-6-months");

  const yesLast6MonthsOption = page.locator(
    'input[type="radio"][value="yes"]',
  );
  const noLast6MonthsOption = page.locator(
    'input[type="radio"][value="no"]',
  );
  await expect(yesLast6MonthsOption).toBeVisible();
  await expect(noLast6MonthsOption).toBeVisible();

  await page.click('button[type="submit"]');
  await expect(page.locator(".govuk-error-message")).toHaveText(
    /Select if your client got legal help for this matter in the last 6 months/,
  );

  const reasonForYesField = page.locator('textarea[name="reasonForYes"]');
  // Check that the reason field is not visible when "Yes, about the same matter" is not selected
  await expect(reasonForYesField).toBeHidden();

  await yesLast6MonthsOption.check();

  // Check that the reason field is visible when "Yes, about the same matter" is selected
  await expect(reasonForYesField).toBeVisible();

  // Check for validation message when reason field is empty
  await page.click('button[type="submit"]');
  await expect(page.locator(".govuk-error-message")).toHaveText(
    /Enter the reason you’re creating a new case for the same matter/,
  );

  // Fill in the reason field and submit
  await reasonForYesField.fill("Client's circumstances have changed");
  await page.click('button[type="submit"]');
  // Verify redirection to the client details page
  await expect(page).toHaveURL("/create-application/client-details");

  // Navigate back to the legal aid before page
  await page.goto("/create-application/legal-aid-last-6-months");

  // Select "No" and submit
  await noLast6MonthsOption.check();
  await page.click('button[type="submit"]');
  // Verify redirection to the client details page
  await expect(page).toHaveURL("/create-application/client-details");

  const fullNameInput = page.locator('input[name="fullName"]');
  const dateOfBirthDayInput = page.locator('input[name="dateOfBirth[day]"]');
  const dateOfBirthMonthInput = page.locator('input[name="dateOfBirth[month]"]');
  const dateOfBirthYearInput = page.locator('input[name="dateOfBirth[year]"]');

  // Check for the validation messages when fields are empty
  await page.click('button[type="submit"]');
  await expect(page.locator(".govuk-error-message").nth(0)).toHaveText(
    /Enter your client's name/,
  );
  await expect(page.locator(".govuk-error-message").nth(1)).toHaveText(
    /Enter your client's date of birth/,
  );

  // Fill in the full name and submit to check for date of birth validation
  await fullNameInput.fill("John Doe");
  await page.click('button[type="submit"]');
  await expect(page.locator(".govuk-error-message")).toHaveText(
    /Enter your client's date of birth/,
  );

  // Fill in an invalid date of birth and submit
  await dateOfBirthDayInput.fill("31");
  await dateOfBirthMonthInput.fill("2");
  await dateOfBirthYearInput.fill("2000");
  await page.click('button[type="submit"]');
  await expect(page.locator(".govuk-error-message")).toHaveText(
    /Date of birth must be a real date/,
  );

  // Fill in a valid date of birth and submit
  await dateOfBirthDayInput.fill("15");
  await dateOfBirthMonthInput.fill("6");
  await dateOfBirthYearInput.fill("1990");
  await page.click('button[type="submit"]');
  // Verify redirection to the next page (e.g., check answers)
  await expect(page).toHaveURL("/create-application/check-answers");
});
