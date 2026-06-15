import { test, expect } from "../../fixtures/index.js";

test("create application flow", async ({ page }) => {
  // ECF page

  // Navigate to the ECF page
  await page.goto("/create-application/ecf");

  // Check for the question
  await expect(
    page.getByRole("heading", {
      name: /Does this case require Exceptional Case Funding\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Select "Yes" and submit
  await page.getByRole("radio", { name: "Yes" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the ECF dropout page
  await expect(page).toHaveURL("/create-application/ecf-dropout");

  // Navigate back to the ECF page
  await page.goto("/create-application/ecf");

  // Select "No" and submit
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the legal aid before page
  await expect(page).toHaveURL("/create-application/legal-aid-before");

  // Legal aid before page

  // Check for the question
  await expect(
    page.getByRole("heading", {
      name: /Has your client accessed legal aid before\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Select "Yes, about the same matter" and submit
  await page.getByRole("radio", { name: "Yes, about the same matter" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the legal aid before 6 months page
  await expect(page).toHaveURL("/create-application/legal-aid-last-6-months");

  // Legal aid Within 6 months page

  await expect(
    page.getByRole("heading", {
      name: /Did your client get legal help for this matter in the last 6 months\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Check that the reason field is not visible when "Yes, about the same matter" is not selected
  const reasonForYesField = page.getByLabel(
    "Explain the reason for creating a new case for the same matter",
  );
  await expect(reasonForYesField).toBeHidden();

  // Check that the reason field is visible when "Yes, about the same matter" is selected
  await page.getByRole("radio", { name: "Yes" }).check();
  await expect(reasonForYesField).toBeVisible();

  // Check the character count limit
  await expect(
    page.getByText("You can enter up to 500 characters"),
  ).toBeVisible();

  // Fill in the reason field and submit
  await reasonForYesField.fill("Client's circumstances have changed");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the client details page
  await expect(page).toHaveURL("/create-application/client-details");

  // Navigate back to the legal aid before page
  await page.goto("/create-application/legal-aid-last-6-months");

  // Select "No" and submit
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the client details page
  await expect(page).toHaveURL("/create-application/client-details");

  // Client Details page

  // Check for the title
  await expect(
    page.getByRole("heading", {
      name: /Your client's details/,
      level: 1,
    }),
  ).toBeVisible();

  // Fill in the full name and date of birth and submit
  await page.getByLabel("Full name").fill("John Doe");
  await page.getByLabel("Day").fill("15");
  await page.getByLabel("Month").fill("6");
  await page.getByLabel("Year").fill("1990");
  await page.getByRole("button", { name: "Continue" }).click();

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

  // Check NI input field is not visible when "Yes" is not selected
  const niNumberInput = page.getByLabel(
    "Enter your client's National Insurance number",
  );
  await expect(niNumberInput).toBeHidden();

  // Select "Yes" and check for NI number input
  await page.getByRole("radio", { name: "Yes" }).check();
  await expect(niNumberInput).toBeVisible();

  // Fill in a valid NI number and submit
  await niNumberInput.fill("JN123456A");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the next page
  await expect(page).toHaveURL("/create-application/have-a-home-address");

  // Navigate back to the NI number page
  await page.goto("/create-application/ni-number");

  // Select "No" and submit
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the next page
  await expect(page).toHaveURL("/create-application/have-a-home-address");

  // Have a home address page

  // Check for the question
  await expect(
    page.getByRole("heading", {
      name: /Does your client have a home address\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Select "Yes" and submit
  await page.getByRole("radio", { name: "Yes" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the enter address manually page
  await expect(page).toHaveURL("/create-application/enter-address-manually");

  // Enter Address Manually page

  // Check for the title
  await expect(
    page.getByRole("heading", {
      name: /Enter your client's home address/,
      level: 1,
    }),
  ).toBeVisible();

  // Fill in the full address and submit
  await page.getByLabel("Address line 1").fill("10 Some Street");
  await page.getByLabel("Town or city").fill("SomeCity");
  await page.getByLabel("Postcode").fill("AB1 2CD");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the next page
  await expect(page).toHaveURL("/create-application/check-answers");

  // Navigate back to the enter-address-manually page
  await page.goto("/create-application/enter-address-manually");

  // Enter Overseas Address page

  // click the non-UK address link
  await page.getByText("The address is not in the UK").click();

  // Verify redirection to the overseas address page
  await expect(page).toHaveURL("/create-application/enter-overseas-address");

  // Check for the title
  await expect(
    page.getByRole("heading", {
      name: /Enter your client's overseas home address/,
      level: 1,
    }),
  ).toBeVisible();

  // Fill in the full address and submit
  
  // expect options to be visible with autocomplete
  await page.getByLabel("Country").fill("Aus");
  const australiaOption = page.getByRole("option", { name: "Australia" });
  expect(australiaOption).toBeVisible();
  expect(page.getByRole("option", { name: "Austria" })).toBeVisible();

  await australiaOption.click();

  await page.getByLabel("Address line 1").fill("10 Some Street");
  await page.getByRole("button", { name: "Continue" }).click();
  // Check Answers page
  
  // Check for the title
  await expect(
    page.getByRole("heading", {
      name: /Check your answers/,
      level: 1,
    }),
  ).toBeVisible();
  
  // Check that all answers are displayed correctly
  const summaryList = page.locator(".govuk-summary-list");
  const rows = summaryList.locator(".govuk-summary-list__row");
  await expect(rows).toHaveCount(6);
  await expect(rows.nth(0).locator(".govuk-summary-list__key")).toHaveText("ECF");
  await expect(rows.nth(0).locator(".govuk-summary-list__value")).toHaveText("No");
  await expect(rows.nth(1).locator(".govuk-summary-list__key")).toHaveText("Accessed legal aid before");
  await expect(rows.nth(1).locator(".govuk-summary-list__value")).toHaveText("Yes, about the same matter");
  await expect(rows.nth(2).locator(".govuk-summary-list__key")).toHaveText("Did your client get legal help for this matter in the last 6 months?");
  await expect(rows.nth(2).locator(".govuk-summary-list__value")).toHaveText("No");
  await expect(rows.nth(3).locator(".govuk-summary-list__key")).toHaveText("Full name");
  await expect(rows.nth(3).locator(".govuk-summary-list__value")).toHaveText("John Doe");
  await expect(rows.nth(4).locator(".govuk-summary-list__key")).toHaveText("Date of birth");
  await expect(rows.nth(4).locator(".govuk-summary-list__value")).toHaveText("15 June 1990");
  await expect(rows.nth(5).locator(".govuk-summary-list__key")).toHaveText("Address");
  await expect(rows.nth(5).locator(".govuk-summary-list__value")).toHaveText(
    "\n    10 Some Street,\n    \n    SomeCity,\n    \n    AB1 2CD\n  ",
  );

  const changeAddressLink = rows.nth(5).locator(".govuk-summary-list__actions a");
  await expect(changeAddressLink).toHaveAttribute(
    "href",
    "enter-address-manually?returnTo=check-answers",
  );
  changeAddressLink.click();
  
  // Verify redirection back to the enter address manually page
  await expect(page).toHaveURL("/create-application/enter-address-manually?returnTo=check-answers");
  // Navigate back to the check answers page
  const continueButton = page.getByRole("button", { name: "Continue" });
  await continueButton.click();
  await expect(page).toHaveURL("/create-application/check-answers");

  // Check that the submit button is displayed
  const submitButton = page.getByRole("button", { name: "Save and continue" });
  await expect(submitButton).toBeVisible();

  // Submit the form
  await submitButton.click();

  // Verify redirection to the task list page
  await expect(page).toHaveURL("/create-application/task-list");
});
