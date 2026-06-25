import type { BlockDefinition } from "@ministryofjustice/hmpps-forge/core/components";

import { Format } from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKButton,
  GovUKHeading,
  GovUKTaskList,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import type { TaskListData } from "#/journeys/create-application/steps/task-list/task-list.step.js";

import { taskItem } from "#/journeys/journey.blocks.js";
import { H2 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

/**
 * Builds a GovUKBody block for the case reference number.
 * @param caseRefNumber - The text content for the Body.
 * @returns A GovUKBody block definition.
 */
export function caseReferenceNumber(
  caseRefNumber: string,
): ReturnType<typeof GovUKBody> {
  return GovUKBody({ text: Format("Reference number: %1", caseRefNumber) });
}

/**
 * Builds a heading block.
 * @param text - The text content for the heading.
 * @returns A heading block definition.
 */
export function heading(text: string): ReturnType<typeof GovUKHeading> {
  return GovUKHeading({ text });
}
/**
 * Builds the task list page blocks for the create application journey.
 * @param taskListData - The data used to populate the task list items.
 * @returns Array of block definitions for the task list page.
 */
export function taskList(taskListData: TaskListData): BlockDefinition[] {
  return [
    GovUKHeading({
      classes: "govuk-label--m",
      level: H2,
      text: t("journeys.createApplication.taskList.clientDetails.title"),
    }),
    GovUKTaskList({
      items: [
        taskItem(
          t("journeys.createApplication.taskList.clientDetails.taskItem.label"),
          "check-answers",
          taskListData.clientDetails.status,
        ),
      ],
    }),
    GovUKHeading({
      classes: "govuk-label--m",
      level: H2,
      text: t("journeys.createApplication.taskList.meansAssessment.title"),
    }),
    GovUKTaskList({
      items: [
        taskItem(
          t(
            "journeys.createApplication.taskList.meansAssessment.taskItem.label",
          ),
          "income-TODO",
          taskListData.meansAssessment.status,
        ),
      ],
    }),
    GovUKHeading({
      classes: "govuk-label--m",
      level: H2,
      text: t(
        "journeys.createApplication.taskList.EvidenceAndDeclaration.title",
      ),
    }),
    GovUKTaskList({
      items: [
        taskItem(
          t(
            "journeys.createApplication.taskList.EvidenceAndDeclaration.taskItem.evidence.label",
          ),
          "evidence-TODO",
          taskListData.evidence.status,
        ),
        taskItem(
          t(
            "journeys.createApplication.taskList.EvidenceAndDeclaration.taskItem.declaration.label",
          ),
          "client-declaration-TODO",
          taskListData.declaration.status,
        ),
      ],
    }),
  ];
}

export const saveAndReturnButton: GovUKButton = GovUKButton({
  classes: "govuk-button--secondary",
  text: t("common.saveAndReturn"),
});
