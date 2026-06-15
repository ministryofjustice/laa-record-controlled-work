import {
  Answer,
  Condition,
  match,
  redirect,
  step,
  submit,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";
import {
  GovUKButton,
  GovUKHeading,
  GovUKSummaryList,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

const ecfLabel = match(Answer("ecf"))
  .branch(Condition.Equals("yes"), t("common.yes"))
  .branch(Condition.Equals("no"), t("common.no"));

const legalAidBeforeLabel = match(Answer("legalAidBefore"))
  .branch(
    Condition.Equals("yesSameMatter"),
    t("journeys.createApplication.legalAidBefore.radioButton.yesSameMatter"),
  )
  .branch(
    Condition.Equals("yesDifferentMatter"),
    t(
      "journeys.createApplication.legalAidBefore.radioButton.yesDifferentMatter",
    ),
  )
  .branch(Condition.Equals("no"), t("common.no"));

const legalAidLast6MonthsLabel = match(Answer("legalAidLast6Months"))
  .branch(Condition.Equals("yes"), t("common.yes"))
  .branch(Condition.Equals("no"), t("common.no"));

const dateOfBirthDisplay = Answer("dateOfBirth").pipe(
  Transformer.String.ToDate(),
  Transformer.Date.Format("D MMMM YYYY"),
);

const addressDisplay = NunjucksGenerators.String({
  data: {
    county: Answer("county"),
    line1: Answer("addressLine1"),
    line2: Answer("addressLine2"),
    postcode: Answer("postcode"),
    town: Answer("townOrCity"),
  },
  template: `
    {{ line1 }},<br />
    {% if line2 %}{{ line2 }},<br />{% endif %}
    {{ town }},<br />
    {% if county %}{{ county }},<br />{% endif %}
    {{ postcode }}
  `,
});

export const checkAnswersStep = (): ReturnType<typeof step> =>
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
                  text: t(
                    "journeys.createApplication.checkAnswers.changeLink.change",
                  ),
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
                  text: t(
                    "journeys.createApplication.checkAnswers.changeLink.change",
                  ),
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
                  text: t(
                    "journeys.createApplication.checkAnswers.changeLink.change",
                  ),
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
                  text: t(
                    "journeys.createApplication.checkAnswers.changeLink.change",
                  ),
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
                  text: t(
                    "journeys.createApplication.checkAnswers.changeLink.change",
                  ),
                  visuallyHiddenText: t(
                    "journeys.createApplication.checkAnswers.answerLabels.fullName",
                  ),
                },
              ],
            },
            key: {
              text: t(
                "journeys.createApplication.checkAnswers.answerLabels.fullName",
              ),
            },
            value: { text: Answer("fullName") },
          },
          {
            actions: {
              items: [
                {
                  href: "client-details?returnTo=check-answers",
                  text: t(
                    "journeys.createApplication.checkAnswers.changeLink.change",
                  ),
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
                  text: t(
                    "journeys.createApplication.checkAnswers.changeLink.change",
                  ),
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
                  href: "enter-address-manually?returnTo=check-answers",
                  text: t(
                    "journeys.createApplication.checkAnswers.changeLink.change",
                  ),
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
            value: { html: addressDisplay },
            visibleWhen: Answer("haveAHomeAddress").match(
              Condition.Equals("yes"),
            ),
          },
        ],
      }),
      GovUKButton({
        text: t("journeys.createApplication.checkAnswers.submitButton.submit"),
      }),
    ],
    code: "check-answers",
    onSubmission: [
      submit({
        onAlways: {
          next: [
            redirect({
              goto: "task-list",
            }),
          ],
        },
        validate: false,
      }),
    ],
    path: "/check-answers",
    title: t("journeys.createApplication.checkAnswers.title"),
  });
