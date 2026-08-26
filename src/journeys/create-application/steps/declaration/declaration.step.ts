import {
  redirect,
  step,
  type StepDefinition,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { body } from "#/journeys/create-application/steps/declaration/declaration.blocks.js";
import { backLink, button, heading } from "#/journeys/shared.blocks.js";
import { StepCode } from "#/journeys/StepCode.enum.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.declaration.title");

const AGREE_AND_CONTINUE = t("journeys.createApplication.declaration.continue");
const ROOT = "/";

/**
 * Defines the provider declaration step for the create application journey.
 *
 * @returns {StepDefinition} A step definition for the provider declaration page
 */
export function declarationStep(): StepDefinition {
  return step({
    blocks: [
      backLink(ROOT),
      heading(TITLE),
      body(),
      button(AGREE_AND_CONTINUE),
    ],
    onSubmission: [onSubmission],
    path: "/provider-declaration",
    reachability: { entryWhen: true },
    title: TITLE,
  });
}

const onSubmission = submit({
  onAlways: {
    next: [redirect({ goto: StepCode.ECF })],
  },
  validate: false,
});
