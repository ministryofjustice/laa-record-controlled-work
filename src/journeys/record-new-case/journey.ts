import { PatternEffects } from "#/journeys/effects.js";
import {
  journey,
  step,
  submit,
  redirect,
  Answer,
  Condition,
  validation,
  Self,
  access,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKButton,
  GovUKRadioInput,
  GovUKPanel,
  GovUKHeading,
  GovUKBody,
  GovUKBackLink,
  GovUKSummaryList,
  GovUKTextInput,
  GovUKDateInputFull,
  GovUKUtilityClasses,
} from "@ministryofjustice/hmpps-forge/govuk-components";

const startStep = step({
  path: "/start",
  title: "Record civil controlled work",
  reachability: { entryWhen: true },
  blocks: [
    GovUKBackLink({
      href: "/",
    }),
    GovUKHeading({
      text: "Record civil controlled work",
      level: 1,
    }),
    GovUKBody({
      text: "Use this service to record the civil controlled work or legal help you are completing for a client.",
    }),
    GovUKBody({
      text: "This service replaces the controlled work (CW) PDF forms.",
    }),
    GovUKButton({ text: "Continue" }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        next: [redirect({ goto: "ecf" })],
      },
    }),
  ],
});

const ecfStep = step({
  path: "/ecf",
  title: "Does this case require Exceptional Case Funding?",
  blocks: [
    GovUKBackLink({
      href: "/new-case/start",
    }),
    HtmlBlock({
      content: '<span class="govuk-caption-l">Client and case details</span>',
    }),
    GovUKRadioInput({
      code: "ecf",
      fieldset: {
        legend: {
          text: "Does this case require Exceptional Case Funding?",
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l",
        },
      },
      items: [
        {
          value: "yes",
          text: "Yes",
        },
        {
          value: "no",
          text: "No",
        },
      ],
      validWhen: [
        validation({
          condition: Self().match(Condition.IsRequired()),
          message: "Please select an option",
        }),
      ],
    }),
    GovUKButton({ text: "Continue" }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [PatternEffects.SaveDraftAnswers()],
        next: [
          redirect({
            when: Answer("ecf").match(Condition.Equals("yes")),
            goto: "ecf-dropout",
          }),
          redirect({ goto: "legal-aid-before" }),
        ],
      },
    }),
  ],
});

const ineligibleStep = step({
  path: "/ecf-dropout",
  title: "You are ineligible",
  blocks: [
    GovUKBackLink({
      href: "/new-case/ecf",
    }),
    GovUKHeading({
      text: "You cannot use this service for this type of case",
      level: 1,
    }),
    GovUKBody({
      text: 'Continue to complete the <a href="/government/publications/legal-aid-exceptional-case-funding-form-and-guidance">ECF application form CIV ECF 1</a> and <a href="/government/publications/cw1-financial-eligibility-for-legal-aid-clients">form CW1</a> for your client.',
    }),
    GovUKBody({
      text: 'Send completed forms to: <a href="mailto:contactECC@justice.gov.uk">contactECC@justice.gov.uk</a>',
    }),
  ],
});

const legalAidBeforeStep = step({
  path: "/legal-aid-before",
  title: "Has your client accessed legal aid before?",
  blocks: [
    GovUKBackLink({
      href: "/new-case/ecf",
    }),
    HtmlBlock({
      content: '<span class="govuk-caption-l">Client and case details</span>',
    }),
    GovUKRadioInput({
      code: "legalAidBefore",
      fieldset: {
        legend: {
          text: "Has your client accessed legal aid before?",
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l",
        },
      },
      items: [
        {
          value: "yesSameMatter",
          text: "Yes, about the same matter",
        },
        {
          value: "yesDifferentMatter",
          text: "Yes, about a different matter",
        },
        {
          value: "no",
          text: "No",
        },
      ],
      validWhen: [
        validation({
          condition: Self().match(Condition.IsRequired()),
          message: "Please select an option",
        }),
      ],
    }),
    GovUKButton({ text: "Continue" }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [PatternEffects.SaveDraftAnswers()],
        next: [
          redirect({
            when: Answer("legalAidBefore").match(
              Condition.Equals("yesSameMatter"),
            ),
            goto: "legal-aid-before-2",
          }),
          redirect({ goto: "client-details" }),
        ],
      },
    }),
  ],
});

const legalAidBefore6MonthsStep = step({
  path: "/legal-aid-before-2",
  title: "Did your client get legal help for this matter in the last 6 months?",
  blocks: [
    GovUKBackLink({
      href: "/new-case/legal-aid-before",
    }),
    HtmlBlock({
      content: '<span class="govuk-caption-l">Client and case details</span>',
    }),
    GovUKRadioInput({
      code: "legalAidBefore6Months",
      fieldset: {
        legend: {
          text: "Did your client get legal help for this matter in the last 6 months?",
          isPageHeading: true,
          classes: "govuk-fieldset__legend--l",
        },
      },
      items: [
        {
          value: "yes",
          text: "Yes",
          block: GovUKTextInput({
            code: "reasonForYes",
            label:
              "Explain the reason for creating a new case for the same matter",
            dependentWhen: Answer("legalAidBefore6Months").match(
              Condition.Equals("yes"),
            ),
            validWhen: [
              validation({
                condition: Self().match(Condition.IsRequired()),
                message:
                  "Explain the reason for creating a new case for the same matter",
              }),
            ],
          }),
        },
        {
          value: "no",
          text: "No",
        },
      ],
      validWhen: [
        validation({
          condition: Self().match(Condition.IsRequired()),
          message: "Please select an option",
        }),
      ],
    }),
    GovUKButton({ text: "Continue" }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [PatternEffects.SaveDraftAnswers()],
        next: [
          redirect({ goto: "client-details" }),
        ],
      },
    }),
  ],
});

const clientDetailsStep = step({
  path: "/client-details",
  title: "Your client's details",
  blocks: [
    GovUKBackLink({
      href: "/new-case/legal-aid-before",
    }),
    HtmlBlock({
      content: '<span class="govuk-caption-l">Client and case details</span>',
    }),
    GovUKHeading({
      text: "Your client's details",
    }),
    GovUKTextInput({
      code: "fullName",
      label: {
        text: "Full name",
        isPageHeading: false,
        classes: "govuk-label--m",
      },
      validWhen: [
        validation({
          condition: Self().match(Condition.IsRequired()),
          message: "Enter your full name",
        }),
        validation({
          condition: Self().match(Condition.String.HasMinLength(2)),
          message: "Full name must be 2 characters or more",
        }),
      ],
    }),
    GovUKDateInputFull({
      code: "dateOfBirth",
      fieldset: {
        legend: {
          text: "Date of birth",
          isPageHeading: false,
          classes: GovUKUtilityClasses.Fieldset.MediumLabel,
        },
      },
      hint: {
        text: "For example, 31 3 1980",
      },
      validWhen: [
        validation({
          condition: Self().match(Condition.Date.IsPastDate()),
          message: "Date must be in the past",
        }),
      ],
    }),
    GovUKButton({ text: "Continue" }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        effects: [PatternEffects.SaveDraftAnswers()],
        next: [redirect({ goto: "check-answers" })],
      },
    }),
  ],
});

const checkAnswersStep = step({
  code: "check-answers",
  path: "/check-answers",
  title: "Check your answers",
  blocks: [
    GovUKHeading({
      text: "Check your answers",
    }),
    GovUKSummaryList({
      rows: [
        {
          key: { text: "ECF" },
          value: { text: Answer("ecf") },
          actions: {
            items: [
              {
                href: "ecf?returnTo=check-answers",
                text: "Change",
                visuallyHiddenText: "ecf",
              },
            ],
          },
        },
        {
          key: { text: "Received Legal Aid before" },
          value: { text: Answer("legalAidBefore") },
          actions: {
            items: [
              {
                href: "legal-aid-before?returnTo=check-answers",
                text: "Change",
                visuallyHiddenText: "received legal aid before",
              },
            ],
          },
        },
        {
          key: { text: "Legal help within 6 months" },
          value: { text: Answer("legalAidBefore6Months") },
          actions: {
            items: [
              {
                href: "legal-aid-before-2?returnTo=check-answers",
                text: "Change",
                visuallyHiddenText: "Legal help within 6 months",
              },
            ],
          },
          visibleWhen: Answer("legalAidBefore").match(
            Condition.Equals("yesSameMatter"),
          ),
        },
        {
          key: { text: "Reason for reapply" },
          value: { text: Answer("reasonForYes") },
          actions: {
            items: [
              {
                href: "legal-aid-before-2?returnTo=check-answers",
                text: "Change",
                visuallyHiddenText: "Reason for reapply",
              },
            ],
          },
          visibleWhen: Answer("legalAidBefore6Months").match(
            Condition.Equals("yes"),
          ),
        },
        {
          key: { text: "Full name" },
          value: { text: Answer("fullName") },
          actions: {
            items: [
              {
                href: "client-details?returnTo=check-answers",
                text: "Change",
                visuallyHiddenText: "Full name",
              },
            ],
          },
        },
        {
          key: { text: "Date of Birth" },
          value: { text: Answer("dateOfBirth") },
          actions: {
            items: [
              {
                href: "client-details?returnTo=check-answers",
                text: "Change",
                visuallyHiddenText: "Date of birth",
              },
            ],
          },
        },
      ],
    }),
    GovUKBody({
      text: 'Selecting "Confirm" will save your answers.',
    }),
    GovUKButton({ text: "Done" }),
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

const confirmationStep = step({
  path: "/confirmation",
  title: "Case created",
  blocks: [GovUKPanel({ titleText: "Data sent" })],
});

export const newCaseJourney = journey({
  code: "newCase",
  title: "Record new case",
  path: "/new-case",
  onAccess: [
    access({
      effects: [PatternEffects.LoadDraftAnswers()],
    }),
  ],
  reachability: { disableReachabilityChecks: true },
  view: { template: "partials/form-step" },
  steps: [
    startStep,
    ecfStep,
    ineligibleStep,
    legalAidBeforeStep,
    legalAidBefore6MonthsStep,
    clientDetailsStep,
    checkAnswersStep,
    confirmationStep,
  ],
});
