import {
  Answer,
  Condition,
  redirect,
  Self,
  step,
  submit,
  type SubmitHook,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKButton,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  OVERSEAS_ADDRESS_FIELDS,
  UK_ADDRESS_FIELDS,
} from "#/journeys/journey.constants.js";
import { hasCheckAnswersInQuery } from "#/journeys/shared.hook.js";
import { t } from "#/lib/i18n.js";

export const haveAHomeAddressStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      HtmlBlock({
        content: `<span class="govuk-caption-l">${t("journeys.createApplication.caption")}</span>`,
      }),
      GovUKRadioInput({
        code: "haveAHomeAddress",
        fieldset: {
          legend: {
            classes: "govuk-fieldset__legend--l",
            isPageHeading: true,
            text: t("journeys.createApplication.haveAHomeAddress.title"),
          },
        },
        hint: {
          text: t("journeys.createApplication.haveAHomeAddress.hint"),
        },
        items: [
          {
            text: t("common.yes"),
            value: "yes",
          },
          {
            text: t(
              "journeys.createApplication.haveAHomeAddress.radioButton.no",
            ),
            value: "no",
          },
        ],
        validWhen: [
          validation({
            condition: Self().match(Condition.IsRequired()),
            message: t(
              "journeys.createApplication.haveAHomeAddress.validation.required",
            ),
          }),
        ],
      }),
      GovUKButton({ text: t("common.continue") }),
    ],
    onSubmission: [
      saveNoAndClearAddressAnswers(journeyCode),
      saveYes(journeyCode),
      submitInvalid,
    ],
    path: "/have-a-home-address",
    reachability: {
      entryWhen: hasCheckAnswersInQuery,
    },
    title: t("journeys.createApplication.haveAHomeAddress.title"),
  });

const saveNoAndClearAddressAnswers = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [
        CreateApplicationEffects.clearFieldAnswers(journeyCode, [
          ...Object.values(UK_ADDRESS_FIELDS),
          ...Object.values(OVERSEAS_ADDRESS_FIELDS),
        ]),
        CreateApplicationEffects.saveDraftAnswers(journeyCode),
      ],
      next: [redirectToCheckAnswers],
    },
    validate: true,
    when: Answer("haveAHomeAddress").match(Condition.Equals("no")),
  });

const saveYes = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [redirectToAddressWithCheckQuery, redirectToAddress],
    },
    validate: true,
    when: Answer("haveAHomeAddress").match(Condition.Equals("yes")),
  });

const submitInvalid = submit({
  onInvalid: {},
  validate: true,
});

const redirectToAddressWithCheckQuery = redirect({
  goto: "enter-address-manually?returnTo=check-answers",
  when: hasCheckAnswersInQuery,
});

const redirectToAddress = redirect({ goto: "enter-address-manually" });

const redirectToCheckAnswers = redirect({ goto: "check-answers" });
