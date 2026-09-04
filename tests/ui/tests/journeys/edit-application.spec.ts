import { expect, test } from "../../fixtures/index.js";
import {
  completeApplication,
  incompleteApplication,
} from "../../msw/fixtures/rcw.fixtures.js";

const INCOMPLETE_TASK_LIST_COUNT = 2;
const COMPLETE_TASK_LIST_COUNT = 3;
const CLIENT_DETAILS_TASK_INDEX = 0;
const MEANS_ASSESSMENT_TASK_INDEX = 1;
const PAGE_HEADING_LEVEL = 1;

test("Edit Application - Task List step", async ({
  withSelectedOffice: page,
}) => {
  const applicationId = incompleteApplication.id;
  const clientName = `${incompleteApplication.clientDetails.firstName} ${
    incompleteApplication.clientDetails.lastName
  }`;
  // ==========================================================================
  // Task list page
  // ==========================================================================

  // Navigate to the task-list page using the application ID from fixtures
  await page.goto(`/cases/${applicationId}/task-list`);

  // Check for the Heading
  await expect(
    page.getByRole("heading", {
      level: PAGE_HEADING_LEVEL,
      name: clientName,
    }),
  ).toBeVisible();

  // Check the reference number is displayed
  await expect(
    page.getByText(
      `Reference number: ${incompleteApplication.applicationRefNumber}`,
    ),
  ).toBeVisible();

  // Check that the task list sections are displayed
  const taskListSections = page.locator(".govuk-task-list");
  await expect(taskListSections).toHaveCount(INCOMPLETE_TASK_LIST_COUNT);

  // Check that the client details task is marked as completed
  const clientDetailsTask = taskListSections
    .nth(CLIENT_DETAILS_TASK_INDEX)
    .locator(".govuk-task-list__item");
  await expect(
    clientDetailsTask.locator(".govuk-task-list__status"),
  ).toHaveText("Completed");

  // Check that the means assessment task is marked as incomplete
  const meansAssessmentTask = taskListSections
    .nth(MEANS_ASSESSMENT_TASK_INDEX)
    .locator(".govuk-task-list__item");
  await expect(
    meansAssessmentTask.locator(".govuk-task-list__status"),
  ).toHaveText("Incomplete");

  // Submit the task list form
  await page.getByRole("button", { name: "Save and return later" }).click();

  // Verify redirection to the case list page
  await expect(page).toHaveURL("/cases");
});

test("Edit Application - Task List step - Record Controlled Work button - Confirm", async ({
  withSelectedOffice: page,
}) => {
  const applicationId = completeApplication.id;

  await page.goto(`/cases/${applicationId}/task-list`);

  const taskListSections = page.locator(".govuk-task-list");
  await expect(taskListSections).toHaveCount(COMPLETE_TASK_LIST_COUNT);

  const allStatuses = page.locator(".govuk-task-list__status");
  await expect(allStatuses).toHaveText([
    "Completed",
    "Completed",
    "Completed",
    "Completed",
  ]);

  const submitButton = page.getByRole("button", {
    name: "Record controlled work",
  });

  await expect(submitButton).toBeVisible();

  await submitButton.click();

  await expect(page).toHaveURL(`/cases/${applicationId}/confirmation`);

  const confirmationHeading = page.getByRole("heading", {
    name: "Controlled work recorded",
  });
  await expect(confirmationHeading).toBeVisible();

  const returnToCaseListButton = page.getByRole("button", {
    name: "Return to case list",
  });
  await expect(returnToCaseListButton).toBeVisible();

  await returnToCaseListButton.click();

  await expect(page).toHaveURL("/cases");
});
