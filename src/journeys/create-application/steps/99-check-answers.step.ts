import {
  step,
  submit,
  redirect,
  Answer,
  Condition,
  match,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKButton,
  GovUKHeading,
  GovUKSummaryList,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { t } from "#/lib/i18nLoader.js";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";

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
    t("journeys.createApplication.legalAidBefore.radioButton.yesDifferentMatter"),
  )
  .branch(
    Condition.Equals("no"),
    t("common.no"),
  );

const legalAidLast6MonthsLabel = match(Answer("legalAidLast6Months"))
  .branch(
    Condition.Equals("yes"),
    t("common.yes"),
  )
  .branch(
    Condition.Equals("no"),
    t("common.no"),
  );

const dateOfBirthDisplay = Answer("dateOfBirth").pipe(
  Transformer.String.ToDate(),
  Transformer.Date.Format("D MMMM YYYY"),
);

const hasNiNumberLabel = match(Answer("hasNINumber"))
  .branch(
    Condition.Equals("yes"),
    t("common.yes"),
  )
  .branch(
    Condition.Equals("no"),
    t("common.no"),
  );

const homeAddressLabel = match(Answer("haveAHomeAddress"))
  .branch(
    Condition.Equals("yes"),
    t("common.yes"),
  )
  .branch(
    Condition.Equals("no"),
    t("journeys.createApplication.haveAHomeAddress.no"),
  );

const addressDisplay = NunjucksGenerators.String({
  template: `
    {{ line1 }},<br />
    {% if line2 %}{{ line2 }},<br />{% endif %}
    {{ town }},<br />
    {% if county %}{{ county }},<br />{% endif %}
    {{ postcode }}
  `,
  data: {
    line1: Answer('addressLine1'),
    line2: Answer('addressLine2'),
    town: Answer('townOrCity'),
    county: Answer('county'),
    postcode: Answer('postcode'),
  },
})

export const checkAnswersStep = (): ReturnType<typeof step> =>
  step({
    code: "check-answers",
    path: "/check-answers",
    title: t("journeys.createApplication.checkAnswers.title"),
    blocks: [
      GovUKHeading({
        text: t("journeys.createApplication.checkAnswers.title"),
      }),
      GovUKSummaryList({
        rows: [
          {
            key: { text: t("journeys.createApplication.ecf.title") },
            value: { text: ecfLabel },
            actions: {
              items: [
                {
                  href: "ecf?returnTo=check-answers",
                  text: t("journeys.createApplication.checkAnswers.changeLink.change"),
                  visuallyHiddenText: t("journeys.createApplication.ecf.title"),
                },
              ],
            },
          },
          {
            key: { text: t("journeys.createApplication.legalAidBefore.title") },
            value: { text: legalAidBeforeLabel },
            actions: {
              items: [
                {
                  href: "legal-aid-before?returnTo=check-answers",
                  text: t("journeys.createApplication.checkAnswers.changeLink.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.legalAidBefore.title",
                  ),
                },
              ],
            },
          },
          {
            key: {
              text: t("journeys.createApplication.legalAidLast6Months.title"),
            },
            value: { text: legalAidLast6MonthsLabel },
            actions: {
              items: [
                {
                  href: "legal-aid-last-6-months?returnTo=check-answers",
                  text: t("journeys.createApplication.checkAnswers.changeLink.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.legalAidLast6Months.title",
                  ),
                },
              ],
            },
            visibleWhen: Answer("legalAidBefore").match(
              Condition.Equals("yesSameMatter"),
            ),
          },
          {
            key: {
              text: t(
                "journeys.createApplication.legalAidLast6Months.reasonForYes.hint",
              ),
            },
            value: { text: Answer("reasonForYes") },
            actions: {
              items: [
                {
                  href: "legal-aid-last-6-months?returnTo=check-answers",
                  text: t("journeys.createApplication.checkAnswers.changeLink.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.legalAidLast6Months.reasonForYes.hint",
                  ),
                },
              ],
            },
            visibleWhen:
              Answer("legalAidLast6Months").match(Condition.Equals("yes")) &&
              Answer("legalAidBefore").match(Condition.Equals("yesSameMatter")),
          },
          {
            key: {
              text: t(
                "journeys.createApplication.clientDetails.fullName.label",
              ),
            },
            value: { text: Answer("fullName") },
            actions: {
              items: [
                {
                  href: "client-details?returnTo=check-answers",
                  text: t("journeys.createApplication.checkAnswers.changeLink.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.clientDetails.fullName.label",
                  ),
                },
              ],
            },
          },
          {
            key: {
              text: t(
                "journeys.createApplication.clientDetails.dateOfBirth.label",
              ),
            },
            value: { text: dateOfBirthDisplay },
            actions: {
              items: [
                {
                  href: "client-details?returnTo=check-answers",
                  text: t("journeys.createApplication.checkAnswers.changeLink.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.clientDetails.dateOfBirth.label",
                  ),
                },
              ],
            },
          },
          {
            key: { text: t("journeys.createApplication.niNumber.title") },
            value: { text: hasNiNumberLabel },
            actions: {
              items: [
                {
                  href: "ni-number?returnTo=check-answers",
                  text: t("journeys.createApplication.checkAnswers.changeLink.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.niNumber.title",
                  ),
                },
              ],
            },
          },
          {
            key: { text: t("journeys.createApplication.niNumber.label") },
            value: { text: Answer("niNumber") },
            actions: {
              items: [
                {
                  href: "ni-number?returnTo=check-answers",
                  text: t("journeys.createApplication.checkAnswers.changeLink.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.niNumber.label",
                  ),
                },
              ],
            },
            visibleWhen: Answer("hasNINumber").match(Condition.Equals("yes")),
          },
          {
            key: {
              text: t("journeys.createApplication.haveAHomeAddress.title"),
            },
            value: { text: homeAddressLabel },
            actions: {
              items: [
                {
                  href: "have-a-home-address?returnTo=check-answers",
                  text: t("journeys.createApplication.checkAnswers.changeLink.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.haveAHomeAddress.title",
                  ),
                },
              ],
            },
          },
          {
            key: {
              text: t("journeys.createApplication.enterAddressManually.title"),
            },
            value: { html: addressDisplay },
            actions: {
              items: [
                {
                  href: "enter-address-manually?returnTo=check-answers",
                  text: t("journeys.createApplication.checkAnswers.changeLink.change"),
                  visuallyHiddenText: t(
                    "journeys.createApplication.enterAddressManually.title",
                  ),
                },
              ],
            },
            visibleWhen: Answer("haveAHomeAddress").match(
              Condition.Equals("yes"),
            ),
          },
        ],
      }),
      GovUKButton({ text: t("journeys.createApplication.checkAnswers.submitButton.submit") }),
    ],
    onSubmission: [
      submit({
        validate: false,
        onAlways: {
          next: [
            redirect({
              goto: "confirmation",
            }),
          ],
        },
      }),
    ],
  });
