import {
  Condition,
  Data,
  Format,
  match,
  Params,
  when,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  type BlockDefinition,
  HtmlBlock,
  type ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKBody,
  GovUKButton,
  GovUKButtonGroup,
  GovUKHeading,
  GovUKTaskList,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { taskItem } from "#/journeys/edit-application/steps/task-list/task-list.helpers.js";
import {
  APPLICATION_DATA_KEYS,
  CONTEXT_DATA_KEYS,
  PARAMS_KEYS,
} from "#/journeys/journey.constants.js";
import { Status } from "#/journeys/journey.types.js";
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
    sectionHeading(t("journeys.editApplication.taskList.clientDetails.title")),
    GovUKTaskList({
      items: [
        taskItem(
          t("journeys.editApplication.taskList.clientDetails.taskItem.label"),
          "/cases/new/check-answers",
          Data(CONTEXT_DATA_KEYS.clientDetailsStatus),
        ),
      ],
    }),
    sectionHeading(
      t("journeys.editApplication.taskList.meansAssessment.title"),
    ),
    GovUKTaskList({
      items: [
        taskItem(
          t("journeys.editApplication.taskList.meansAssessment.taskItem.label"),
          match(Data(CONTEXT_DATA_KEYS.meansAssessment))
            .branch(
              Condition.Equals(Status.COMPLETED),
              Format(
                "/cases/%1/eligibility/?destination=check-answers",
                Params(PARAMS_KEYS.applicationID),
              ),
            )
            .otherwise(
              Format(
                "/cases/%1/eligibility/",
                Params(PARAMS_KEYS.applicationID),
              ),
            ),
          Data(CONTEXT_DATA_KEYS.meansAssessment),
        ),
      ],
    }),
    eligibilityResult(),
    sectionHeading(
      t("journeys.editApplication.taskList.EvidenceAndDeclaration.title"),
    ),
    GovUKTaskList({
      items: [
        taskItem(
          t(
            "journeys.editApplication.taskList.EvidenceAndDeclaration.taskItem.evidence.label",
          ),
          Format(
            "/cases/%1/evidence/have-evidence",
            Params(PARAMS_KEYS.applicationID),
          ),
          Data(CONTEXT_DATA_KEYS.evidenceStatus),
        ),
        taskItem(
          t(
            "journeys.editApplication.taskList.EvidenceAndDeclaration.taskItem.declaration.label",
          ),
          Format("/cases/%1/declaration/", Params(PARAMS_KEYS.applicationID)),
          Data(CONTEXT_DATA_KEYS.declarationStatus),
        ),
      ],
    }),
  ];
}

/**
 * Builds the eligibility result indicator.
 * @returns The eligibility result HTML block.
 */
function eligibilityResult(): HtmlBlock {
  const eligibleContent = match(
    Data(CONTEXT_DATA_KEYS.application).path(
      APPLICATION_DATA_KEYS.eligibilityOverallResult,
    ),
  )
    .branch(
      Condition.Equals("eligible"),
      t("journeys.editApplication.taskList.eligibilityResult.eligible"),
    )
    .otherwise("");

  return HtmlBlock({
    content: Format(
      `<div class="eligibility-result-box">
        <h2 class="govuk-heading-s">%1</h2>
        <p class="govuk-body">%2</p>
        <p class="govuk-!-margin-bottom-0"><a class="govuk-link" href="/cases/%3/eligibility/?destination=check-result">%4</a></p>
      </div>`,
      t("journeys.editApplication.taskList.eligibilityResult.title"),
      eligibleContent,
      Params(PARAMS_KEYS.applicationID),
      t("journeys.editApplication.taskList.eligibilityResult.viewResult"),
    ),
    visibleWhen: Data(CONTEXT_DATA_KEYS.application)
      .path(APPLICATION_DATA_KEYS.eligibilityOverallResult)
      .match(Condition.IsRequired()),
  });
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

const saveAndReturnButton: GovUKButton = GovUKButton({
  classes: "govuk-button--secondary",
  text: t("common.saveAndReturn"),
  value: "return",
});

const submitButton: GovUKButton = GovUKButton({
  classes: when(
    Data(CONTEXT_DATA_KEYS.readyForSubmission).match(Condition.Equals(true)),
  )
    .then("")
    .else("govuk-!-display-none"),
  text: t("journeys.editApplication.taskList.submitButton.label"),
  value: "submit",
});

export const buttonGroup = (): HtmlBlock =>
  GovUKButtonGroup({
    buttons: [submitButton, saveAndReturnButton],
  });
