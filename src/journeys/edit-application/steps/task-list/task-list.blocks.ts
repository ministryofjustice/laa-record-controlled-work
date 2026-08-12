import type {
  BlockDefinition,
  ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";

import {
  Data,
  Format,
  Params,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKButton,
  GovUKHeading,
  GovUKTaskList,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { taskItem } from "#/journeys/edit-application/steps/task-list/task-list.helpers.js";
import {
  CONTEXT_DATA_KEYS,
  PARAMS_KEYS,
} from "#/journeys/journey.constants.js";
import { H2 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

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
export function heading(
  text: ResolvableString,
): ReturnType<typeof GovUKHeading> {
  return GovUKHeading({ text });
}

/**
 * Builds the task list page blocks for the create application journey.
 * @returns Array of block definitions for the task list page.
 */
export function taskList(): BlockDefinition[] {
  return [
    sectionHeading(
      t("journeys.createApplication.taskList.clientDetails.title"),
    ),
    GovUKTaskList({
      items: [
        taskItem(
          t("journeys.createApplication.taskList.clientDetails.taskItem.label"),
          "/cases/new/check-answers",
          Data(CONTEXT_DATA_KEYS.clientDetailsStatus),
        ),
      ],
    }),
    sectionHeading(
      t("journeys.createApplication.taskList.meansAssessment.title"),
    ),
    GovUKTaskList({
      items: [
        taskItem(
          t(
            "journeys.createApplication.taskList.meansAssessment.taskItem.label",
          ),
          Format("/cases/%1/eligibility/", Params(PARAMS_KEYS.applicationID)),
          Data(CONTEXT_DATA_KEYS.meansAssessment),
        ),
      ],
    }),
    sectionHeading(
      t("journeys.createApplication.taskList.EvidenceAndDeclaration.title"),
    ),
    GovUKTaskList({
      items: [
        taskItem(
          t(
            "journeys.createApplication.taskList.EvidenceAndDeclaration.taskItem.evidence.label",
          ),
          "/cases/evidence/have-evidence",
          Data(CONTEXT_DATA_KEYS.evidenceStatus),
        ),
        taskItem(
          t(
            "journeys.createApplication.taskList.EvidenceAndDeclaration.taskItem.declaration.label",
          ),
          Format("/cases/%1/declaration/", Params(PARAMS_KEYS.applicationID)),
          Data(CONTEXT_DATA_KEYS.declarationStatus),
        ),
      ],
    }),
  ];
}

/**
 * Builds a section heading for each task list group.
 * @param text - The text content for the section heading.
 * @returns A section heading block definition.
 */
function sectionHeading(
  text: ResolvableString,
): ReturnType<typeof GovUKHeading> {
  return GovUKHeading({
    classes: "govuk-label--m",
    level: H2,
    text,
  });
}

export const saveAndReturnButton: GovUKButton = GovUKButton({
  classes: "govuk-button--secondary",
  text: t("common.saveAndReturn"),
});
