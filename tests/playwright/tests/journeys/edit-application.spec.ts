import { test, expect } from "../../fixtures/index.js";
import { application } from "../../fixtures/rcw.fixtures.js";

test("Edit Application - Task List step", async ({ withSelectedOffice: page }) => {
  const applicationId = application.id;
   const clientName = application.clientDetails.firstName + " " + application.clientDetails.lastName;
 // ==========================================================================
  // Task list page
  // ==========================================================================

  // Navigate to the task-list page using the application ID from fixtures
  await page.goto(`/cases/${applicationId}/task-list/`);

  // Check for the Heading
  await expect(
    page.getByRole("heading", {
      name: clientName,
      level: 1,
    }),
  ).toBeVisible();
  
    // Check the reference number is displayed
  await expect(page.getByText(`Reference number: ${applicationId}`)).toBeVisible();

  // Check that the task list sections are displayed
  const taskListSections = page.locator(".govuk-task-list");
  await expect(taskListSections).toHaveCount(3);

  // Check that the client details task is marked as completed
  const clientDetailsTask = taskListSections.nth(0).locator(".govuk-task-list__item");
  await expect(clientDetailsTask.locator(".govuk-task-list__status")).toHaveText("Completed");
  
  // Check that the means assessment task is marked as incomplete
  const meansAssessmentTask = taskListSections.nth(1).locator(".govuk-task-list__item");
  await expect(meansAssessmentTask.locator(".govuk-task-list__status")).toHaveText("Incomplete");
  
  // Submit the task list form
  await page.getByRole("button", { name: "Save and return later" }).click();

  // Verify redirection to the case list page
  await expect(page).toHaveURL("/case-list"); 

});
