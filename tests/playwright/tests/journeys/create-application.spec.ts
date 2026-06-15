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
  const irelandOption = page.getByRole("option", { name: "Australia" });
  expect(irelandOption).toBeVisible();
  expect(page.getByRole("option", { name: "Austria" })).toBeVisible();

  await irelandOption.click();

  await page.getByLabel("Address line 1").fill("10 Some Street");
  await page.getByRole("button", { name: "Continue" }).click();
});
