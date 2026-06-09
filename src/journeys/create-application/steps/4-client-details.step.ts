import {
  Condition,
  Query,
  redirect,
  Self,
  step,
  submit,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKBackLink,
  GovUKButton,
  GovUKDateInputFull,
  GovUKHeading,
  GovUKTextInput,
  GovUKUtilityClasses,
  GovUKValidations,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { JourneyEffects } from "#/journeys/effects.js";
import { t } from "#/lib/i18nLoader.js";

export const clientDetailsStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/create-application/legal-aid-before",
      }),
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKHeading({
        text: t("journeys.createApplication.clientDetails.title"),
      }),
      GovUKTextInput({
        code: "fullName",
        label: {
          classes: "govuk-label--m",
          isPageHeading: false,
          text: t("journeys.createApplication.clientDetails.fullName.label"),
        },
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.createApplication.clientDetails.fullName.validation.required",
            ),
          }),
        ],
      }),
      GovUKDateInputFull({
        code: "dateOfBirth",
        fieldset: {
          legend: {
            classes: GovUKUtilityClasses.Fieldset.MediumLabel,
            isPageHeading: false,
            text: "Date of birth",
          },
        },
        hint: {
          text: t("journeys.createApplication.clientDetails.dateOfBirth.hint"),
        },
        validWhen: [
          ...GovUKValidations.DateInputFull({
            empty: {
              message: t(
                "journeys.createApplication.clientDetails.dateOfBirth.validation.empty",
              ),
            },
            invalid: {
              message: t(
                "journeys.createApplication.clientDetails.dateOfBirth.validation.invalid",
              ),
            },
            missingDay: {
              message: t(
                "journeys.createApplication.clientDetails.dateOfBirth.validation.missingDay",
              ),
            },
            missingMonth: {
              message: t(
                "journeys.createApplication.clientDetails.dateOfBirth.validation.missingMonth",
              ),
            },
            missingYear: {
              message: t(
                "journeys.createApplication.clientDetails.dateOfBirth.validation.missingYear",
              ),
            },
            mustBePast: {
              message: t(
                "journeys.createApplication.clientDetails.dateOfBirth.validation.mustBePast",
              ),
              submissionOnly: true,
            },
          }),
        ],
      }),
      GovUKButton({ text: t("common.continue") }),
    ],
    onSubmission: [
      submit({
        onValid: {
          effects: [JourneyEffects.SaveDraftAnswers(journeyCode)],
          next: [
            redirect({
              goto: "check-answers",
              when: Query("returnTo").match(Condition.Equals("check-answers")),
            }),
            redirect({ goto: "ni-number" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/client-details",
    title: t("journeys.createApplication.clientDetails.title"),
  });
