import { test, expect } from "../../fixtures/index.js";

test("create application flow", async ({ page }) => {

  // ==========================================================================
  // Provider Declaration page
  // ==========================================================================

  // Navigate to the provider declaration page
  await page.goto("/cases/new/provider-declaration");

  // Check for the question
  await expect(
    page.getByRole("heading", {
      name: /Declaration/,
      level: 1,
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Agree and continue" }).click();

  // Verify redirection to the ECF page
  await expect(page).toHaveURL("/cases/new/ecf");

  // Navigate back to the provider declaration page
  await page.goto("/cases/new/provider-declaration");

  // ==========================================================================
  // ECF page
  // ==========================================================================

  // Navigate to the ECF page
  await page.goto("/cases/new/ecf");

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
  await expect(page).toHaveURL("/cases/new/ecf-dropout");

  // Navigate back to the ECF page
  await page.goto("/cases/new/ecf");

  // Select "No" and submit
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the legal aid before page
  await expect(page).toHaveURL("/cases/new/legal-aid-before");

  // ==========================================================================
  // Legal aid before page
  // ==========================================================================

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
  await expect(page).toHaveURL("/cases/new/legal-aid-last-6-months");

  // ==========================================================================
  // Legal aid within 6 months page
  // ==========================================================================

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
  await expect(page).toHaveURL("/cases/new/client-details");

  // Navigate back to the legal aid before page
  await page.goto("/cases/new/legal-aid-last-6-months");

  // Select "No" and submit
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the client details page
  await expect(page).toHaveURL("/cases/new/client-details");

  // ==========================================================================
  // Client details page
  // ==========================================================================

  // Check for the title
  await expect(
    page.getByRole("heading", {
      name: /Your client's details/,
      level: 1,
    }),
  ).toBeVisible();

  // Fill in the full name and date of birth and submit
  await page.getByLabel("First name").fill("John");
  await page.getByLabel("Last name").fill("Doe");
  await page.getByLabel("Day").fill("15");
  await page.getByLabel("Month").fill("6");
  await page.getByLabel("Year").fill("1990");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the next page
  await expect(page).toHaveURL("/cases/new/ni-number");

  // ==========================================================================
  // National Insurance number page
  // ==========================================================================

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
  await expect(page).toHaveURL("/cases/new/have-a-home-address");

  // Navigate back to the NI number page
  await page.goto("/cases/new/ni-number");

  // Select "No" and submit
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection to the next page
  await expect(page).toHaveURL("/cases/new/have-a-home-address");

  // ==========================================================================
  // Have a home address page
  // ==========================================================================

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
  await expect(page).toHaveURL("/cases/new/enter-address-manually");

  // ==========================================================================
  // Enter address manually page
  // ==========================================================================

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
  await expect(page).toHaveURL("/cases/new/check-answers");

  // ==========================================================================
  // Check answers page
  // ==========================================================================

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
  await expect(rows).toHaveCount(7);
  await expect(rows.locator(".govuk-summary-list__value")).toHaveText([
    // ECF
    "No",
    // Accessed legal aid before
    "Yes, about the same matter",
    // Did your client get legal help for this matter in the last 6 months?
    "No",
    // First name
    "John",
    // Last name
    "Doe",
    // Date of birth
    "15 June 1990",
    // Address
    "10 Some Street, SomeCity, AB1 2CD",
  ], { useInnerText: true });

  const changeAddressLink = rows.nth(6).locator(".govuk-summary-list__actions a");
  await expect(changeAddressLink).toHaveAttribute(
    "href",
    "enter-address-manually?returnTo=check-answers",
  );
  await changeAddressLink.click();
  
  // Verify redirection back to the enter address manually page
  await expect(page).toHaveURL("/cases/new/enter-address-manually?returnTo=check-answers");
  
  // ==========================================================================
  // Enter overseas address page
  // ==========================================================================

  // click the non-UK address link
  await page.getByRole("link", { name: "The address is not in the UK" }).click();

  // Verify redirection to the overseas address page
  await expect(page).toHaveURL("/cases/new/enter-overseas-address");

  // Check for the title
  await expect(
    page.getByRole("heading", {
      name: /Enter your client's overseas home address/,
    }),
  ).toBeVisible();

  // Fill in the full address and submit
  
  // expect options to be visible with autocomplete
  await page.getByLabel("Country").fill("Aus");
  const australiaOption = page.getByRole("option", { name: "Australia" });
  expect(australiaOption).toBeVisible();
  expect(page.getByRole("option", { name: "Austria" })).toBeVisible();

  await australiaOption.click();

  await page.getByLabel("Address line 1").fill("10 Some Other Street");
  
  // Navigate back to the check answers page
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/cases/new/check-answers");

  // Verify address has been updated in the summary list
  await expect(rows.nth(6).locator(".govuk-summary-list__value")).toHaveText(
    "10 Some Other Street, Australia",
    { useInnerText: true },
  );

  // Check that the submit button is displayed
  const submitButton = page.getByRole("button", { name: "Save and continue" });
  await expect(submitButton).toBeVisible();

  // Submit the form
  await submitButton.click();

  // Verify redirection to the task list page
  await expect(page).toHaveURL("/cases/CW-123456/task-list");

  // ==========================================================================
  // Task list page
  // ==========================================================================

  // Check for the title
  await expect(
    page.getByRole("heading", {
      name: /Joe Blogs/,
      level: 1,
    }),
  ).toBeVisible();
  
  // Check that the task list sections are displayed
  const taskListSections = page.locator(".govuk-task-list");
  await expect(taskListSections).toHaveCount(3);

  // Check that the client details task is marked as completed
  const clientDetailsTask = taskListSections.nth(0).locator(".govuk-task-list__item");
  await expect(clientDetailsTask.locator(".govuk-task-list__status")).toHaveText("Completed");

  // Click Completed link and verify redirection to the check answers page and return
  await clientDetailsTask.locator("a").click();
  await expect(page).toHaveURL("/cases/new/check-answers");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL("/cases/CW-123456/task-list");
  await expect(clientDetailsTask.locator(".govuk-task-list__status")).toHaveText("Completed");

  // Check that the means assessment task is marked as incomplete
  const meansAssessmentTask = taskListSections.nth(1).locator(".govuk-task-list__item");
  await expect(meansAssessmentTask.locator(".govuk-task-list__status")).toHaveText("Incomplete");

  // click Incomplete link and verify redirection to the income page and return
  await meansAssessmentTask.locator("a").click();
  await expect(page).toHaveURL("/cases/CW-123456/eligibility/");
  
  await page.goto("/cases/CW-123456/task-list");

  // Submit the task list form
  await page.getByRole("button", { name: "Save and return later" }).click();

  // Verify redirection to the case list page
  await expect(page).toHaveURL("/case-list"); 
  

});
