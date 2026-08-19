import { expect, test } from "#tests/e2e/playwright.harness.js";
import { taskListUrlPattern } from "#tests/e2e/flows/task-list.flow.js";

const NO_EVIDENCE_REASON_TEXT =
  "It's not possible to get it before starting the work";
const NO_EVIDENCE_DETAILS = "Some details";
const FIRST_SUMMARY_VALUE_INDEX = 0;
const SECOND_SUMMARY_VALUE_INDEX = 1;

test(
  "@e2e evidence no branch captures reason and returns to task list",
  async ({ actor, page }) => {
    await actor.login();
    await actor.selectOfficeByCode("R1XEVG");

    const applicationId = await actor.completeCreateCaseShortestPath();

    await actor.openMeansAssessmentFromTaskList(applicationId);
    await actor.completeCcqShortestEligiblePath(applicationId);

    await expect(page).toHaveURL(taskListUrlPattern(applicationId));

    await page.goto(`/cases/${applicationId}/evidence/have-evidence`);
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(
      `/cases/${applicationId}/evidence/reason-for-no-evidence`,
    );

    await page
      .getByRole("radio", {
        name: new RegExp(NO_EVIDENCE_REASON_TEXT),
      })
      .check();

    await page
      .getByRole("textbox", { name: "Give more details" })
      .fill(NO_EVIDENCE_DETAILS);

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(
      `/cases/${applicationId}/evidence/check-answers`,
    );

    const summaryValues = page.locator(".govuk-summary-list__value");
    await expect(summaryValues.nth(FIRST_SUMMARY_VALUE_INDEX)).toContainText(
      "No",
    );
    await expect(summaryValues.nth(SECOND_SUMMARY_VALUE_INDEX)).toContainText(
      NO_EVIDENCE_REASON_TEXT,
    );
    await expect(summaryValues.nth(SECOND_SUMMARY_VALUE_INDEX)).toContainText(
      NO_EVIDENCE_DETAILS,
    );

    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL(taskListUrlPattern(applicationId));
    await actor.assertTaskStatus("Evidence", "Completed");
  },
);
