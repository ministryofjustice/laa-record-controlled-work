import type {
  BlockDefinition,
  ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";

import { Format, Params } from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKButton,
  GovUKHeading,
  GovUKTaskList,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import type { TaskListData } from "#/journeys/edit-application/steps/task-list/task-list.step.js";

import { taskItem } from "#/journeys/edit-application/steps/task-list/task-list.helpers.js";
import { H2 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";

/**
 * Builds a GovUKBody block for the case reference number.
 * @param caseRefNumber - The text content for the Body.
 * @returns A GovUKBody block definition.
 */
export function caseReferenceNumber(
  caseRefNumber: ResolvableString,
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
          "/cases/new/check-answers",
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
          Format("`/cases/%1/eligibility/`", Params(PARAMS_KEYS.applicationID)),
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
          "/cases/evidence/have-evidence",
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
