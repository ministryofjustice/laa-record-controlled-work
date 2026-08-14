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

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { t } from "#/lib/i18n.js";

export const clientDetailsStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/cases/new/legal-aid-before",
      }),
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKHeading({
        text: t("journeys.createApplication.clientDetails.title"),
      }),
      GovUKTextInput({
        code: "firstName",
        label: {
          classes: "govuk-label--m",
          isPageHeading: false,
          text: t("journeys.createApplication.clientDetails.firstName.label"),
        },
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.createApplication.clientDetails.firstName.validation.required",
            ),
          }),
        ],
      }),
      GovUKTextInput({
        code: "lastName",
        label: {
          classes: "govuk-label--m",
          isPageHeading: false,
          text: t("journeys.createApplication.clientDetails.lastName.label"),
        },
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.createApplication.clientDetails.lastName.validation.required",
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
            text: t(
              "journeys.createApplication.clientDetails.dateOfBirth.label",
            ),
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
          validation({
            condition: Self().match(Condition.Date.IsAfter("1900-01-01")),
            message: t(
              "journeys.createApplication.clientDetails.dateOfBirth.validation.ageLimit",
            ),
          }),
        ],
      }),
      GovUKButton({ text: t("common.continue") }),
    ],
    onSubmission: [
      submit({
        onValid: {
          effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
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
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: t("journeys.createApplication.clientDetails.title"),
  });
