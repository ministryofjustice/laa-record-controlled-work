import type { BlockDefinition } from "@ministryofjustice/hmpps-forge/core/components";

import {
  GovUKHeading,
  GovUKTaskList,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { taskItem } from "#/journeys/journey.blocks.js";
import { Status } from "#/journeys/journey.types.js";
import { H2 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

/**
 * Builds the task list page blocks for the create application journey.
 * @returns Array of block definitions for the task list page.
 */
export function taskList(): BlockDefinition[] {
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
          Status.Completed,
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
          Status.Incomplete,
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
          Status.CannotStart,
        ),
        taskItem(
          t(
            "journeys.createApplication.taskList.EvidenceAndDeclaration.taskItem.declaration.label",
          ),
          "client-declaration-TODO",
          Status.CannotStart,
        ),
      ],
    }),
  ];
}

// TODO check status method for each task and update the status accordingly. Currently, all tasks are hardcoded to Completed, Incomplete, or CannotStart.
