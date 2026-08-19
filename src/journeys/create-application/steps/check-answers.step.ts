import {
  Answer,
  Condition,
  Data,
  Format,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKHeading,
  GovUKSummaryList,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  addressChangeHref,
  addressValueDisplay,
  dateOfBirthDisplay,
  ecfLabel,
  legalAidBeforeLabel,
  legalAidLast6MonthsLabel,
} from "#/journeys/create-application/steps/check-answers.formatters.js";
import { submitButton } from "#/journeys/evidence/common.blocks.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

export const checkAnswersStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKHeading({
        text: t("journeys.createApplication.checkAnswers.title"),
      }),
      GovUKSummaryList({
        rows: [
          {
            actions: {
              items: [
                {
                  href: "ecf?returnTo=check-answers",
                  text: t("common.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.checkAnswers.answerLabels.ecf",
                  ),
                },
              ],
            },
            key: {
              text: t(
                "journeys.createApplication.checkAnswers.answerLabels.ecf",
              ),
            },
            value: { text: ecfLabel },
          },
          {
            actions: {
              items: [
                {
                  href: "legal-aid-before?returnTo=check-answers",
                  text: t("common.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.checkAnswers.answerLabels.legalAidBefore",
                  ),
                },
              ],
            },
            key: {
              text: t(
                "journeys.createApplication.checkAnswers.answerLabels.legalAidBefore",
              ),
            },
            value: { text: legalAidBeforeLabel },
          },
          {
            actions: {
              items: [
                {
                  href: "legal-aid-last-6-months?returnTo=check-answers",
                  text: t("common.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.checkAnswers.answerLabels.legalAidLast6Months",
                  ),
                },
              ],
            },
            key: {
              text: t(
                "journeys.createApplication.checkAnswers.answerLabels.legalAidLast6Months",
              ),
            },
            value: { text: legalAidLast6MonthsLabel },
            visibleWhen: Answer("legalAidBefore").match(
              Condition.Equals("yesSameMatter"),
            ),
          },
          {
            actions: {
              items: [
                {
                  href: "legal-aid-last-6-months?returnTo=check-answers",
                  text: t("common.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.checkAnswers.answerLabels.legalAidLast6MonthsReasonForYes",
                  ),
                },
              ],
            },
            key: {
              text: t(
                "journeys.createApplication.checkAnswers.answerLabels.legalAidLast6MonthsReasonForYes",
              ),
            },
            value: { text: Answer("reasonForYes") },
            visibleWhen: Answer("legalAidLast6Months").match(
              Condition.Equals("yes"),
            ),
          },
          {
            actions: {
              items: [
                {
                  href: "client-details?returnTo=check-answers",
                  text: t("common.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.checkAnswers.answerLabels.firstName",
                  ),
                },
              ],
            },
            key: {
              text: t(
                "journeys.createApplication.checkAnswers.answerLabels.firstName",
              ),
            },
            value: { text: Answer("firstName") },
          },
          {
            actions: {
              items: [
                {
                  href: "client-details?returnTo=check-answers",
                  text: t("common.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.checkAnswers.answerLabels.lastName",
                  ),
                },
              ],
            },
            key: {
              text: t(
                "journeys.createApplication.checkAnswers.answerLabels.lastName",
              ),
            },
            value: { text: Answer("lastName") },
          },
          {
            actions: {
              items: [
                {
                  href: "client-details?returnTo=check-answers",
                  text: t("common.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.checkAnswers.answerLabels.dateOfBirth",
                  ),
                },
              ],
            },
            key: {
              text: t(
                "journeys.createApplication.checkAnswers.answerLabels.dateOfBirth",
              ),
            },
            value: { text: dateOfBirthDisplay },
          },
          {
            actions: {
              items: [
                {
                  href: "ni-number?returnTo=check-answers",
                  text: t("common.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.checkAnswers.answerLabels.niNumber",
                  ),
                },
              ],
            },
            key: {
              text: t(
                "journeys.createApplication.checkAnswers.answerLabels.niNumber",
              ),
            },
            value: { text: Answer("niNumber") },
            visibleWhen: Answer("hasNINumber").match(Condition.Equals("yes")),
          },
          {
            actions: {
              items: [
                {
                  href: addressChangeHref,
                  text: t("common.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.checkAnswers.answerLabels.address",
                  ),
                },
              ],
            },
            key: {
              text: t(
                "journeys.createApplication.checkAnswers.answerLabels.address",
              ),
            },
            value: { html: addressValueDisplay },
          },
        ],
      }),
      submitButton,
    ],
    code: "check-answers",
    onSubmission: [
      submit({
        onAlways: {
          effects: [CreateApplicationEffects.createApplication(journeyCode)],
          next: [
            redirect({
              goto: Format(
                "/cases/%1/task-list",
                Data(CONTEXT_DATA_KEYS.applicationID),
              ),
            }),
          ],
        },
        validate: false,
      }),
    ],
    path: "/check-answers",
    title: t("journeys.createApplication.checkAnswers.title"),
  });
