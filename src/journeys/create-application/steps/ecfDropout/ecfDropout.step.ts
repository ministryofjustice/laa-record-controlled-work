import {
  redirect,
  step,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { t } from "i18next";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  ecfDroupoutBody,
  submitFormsBody,
} from "#/journeys/create-application/steps/ecfDropout/ecfDropout.blocks.js";
import { JourneyPath } from "#/journeys/JourneyPath.enum.js";
import { backLink, button, heading } from "#/journeys/shared.blocks.js";

const ECF_PATH = `${JourneyPath.CREATE_APPLICATION}/ecf`;
const HEADING = t("journeys.createApplication.ecfDropout.heading");
const TITLE = t("journeys.createApplication.ecfDropout.title");
const RETURN_TO_CASE_LIST = t("journeys.createApplication.ecfDropout.button");

export const ineligibleStep = (journeyCode: string): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink(ECF_PATH),
      heading(HEADING),
      ecfDroupoutBody(),
      submitFormsBody(),
      button(RETURN_TO_CASE_LIST),
    ],
    onSubmission: [onSubmission(journeyCode)],
    path: "/ecf-dropout",
    title: TITLE,
  });

const onSubmission = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [CreateApplicationEffects.clearAllDraftAnswers(journeyCode)],
      next: [redirect({ goto: "/" })],
    },
    validate: true,
  });
