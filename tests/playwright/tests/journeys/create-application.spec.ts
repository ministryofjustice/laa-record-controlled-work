import { test, expect } from "../../fixtures/index.js";

test("create application flow", async ({ page }) => {
  // ECF page
  
  // Navigate to the ECF page
  await page.goto("/create-application/ecf");

  // Select "Yes" and submit
  await page.getByRole('radio', { name: 'Yes' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Verify redirection to the ECF dropout page
  await expect(page).toHaveURL("/create-application/ecf-dropout");

  // Navigate back to the ECF page
  await page.goto("/create-application/ecf");

  // Select "No" and submit
  await page.getByRole('radio', { name: 'No' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Verify redirection to the legal aid before page
  await expect(page).toHaveURL("/create-application/legal-aid-before");

  // Legal aid before page

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

  const reasonForYesField = page.locator('textarea[name="reasonForYes"]');
  // Check that the reason field is not visible when "Yes, about the same matter" is not selected
  await expect(reasonForYesField).toBeHidden();

  await yesLast6MonthsOption.check();

  // Check that the reason field is visible when "Yes, about the same matter" is selected
  await expect(reasonForYesField).toBeVisible();

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

  // Fill in a valid date of birth and submit
  await dateOfBirthDayInput.fill("15");
  await dateOfBirthMonthInput.fill("6");
  await dateOfBirthYearInput.fill("1990");
  await page.click('button[type="submit"]');
  // Verify redirection to the next page
  await expect(page).toHaveURL("/create-application/ni-number");

  // Test for NI number page
  
  // Check for the question
  await expect(
    page.getByRole("heading", {
      name: /Does your client have a National Insurance number\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Check for the radio options
  const yesNINumberOption = page.locator(
    'input[type="radio"][value="yes"]',
  );
  const noNINumberOption = page.locator('input[type="radio"][value="no"]');
  await expect(yesNINumberOption).toBeVisible();
  await expect(noNINumberOption).toBeVisible();

  // Select "Yes" and check for NI number input
  await yesNINumberOption.check();
  const niNumberInput = page.locator('input[name="niNumber"]');
  await expect(niNumberInput).toBeVisible();

  // Fill in a valid NI number and submit
  await niNumberInput.fill("JN123456A");
  await page.click('button[type="submit"]');
  // Verify redirection to the next page
  await expect(page).toHaveURL("/create-application/have-a-home-address");

  // Navigate back to the NI number page
  await page.goto("/create-application/ni-number");

  // Select "No" and submit
  await noNINumberOption.check();
  await page.click('button[type="submit"]');
  // Verify redirection to the next page
  await expect(page).toHaveURL("/create-application/have-a-home-address");
   
  // Have a home address page
  
  // Select "Yes" and submit
  await page.getByRole('radio', { name: 'Yes' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Verify redirection to the enter address manually page
  await expect(page).toHaveURL("/create-application/enter-address-manually");
});
