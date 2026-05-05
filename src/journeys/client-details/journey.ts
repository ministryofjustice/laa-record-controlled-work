import {
  journey,
  step,
  submit,
  redirect,
  Answer,
  Condition,
  Query,
  validation,
  Self,
  block,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKTextareaInput,
  GovUKButton,
  GovUKRadioInput,
  GovUKPanel,
  GovUKHeading,
  GovUKSummaryList,
  GovUKBody,
} from "@ministryofjustice/hmpps-forge/govuk-components";

const ecfStep = step({
  path: "/ecf",
  title: "Does this case require Exceptional Case Funding?",
  reachability: { entryWhen: true },
  blocks: [
    block({
      variant: "html",
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
        next: [
          redirect({
            when: Query("returnTo").match(Condition.Equals("check-answers")),
            goto: "check-answers",
          }),
          redirect({ goto: "your-feedback" }),
        ],
      },
    }),
  ],
});

const feedbackStep = step({
  path: "/your-feedback",
  title: "Your feedback",
  blocks: [
    GovUKTextareaInput({
      code: "feedback",
      label: {
        text: "Your feedback",
        isPageHeading: true,
        classes: "govuk-label--l",
      },
      hint: { text: "Tell us what you think of this service." },
      validWhen: [
        validation({
          condition: Self().match(Condition.IsRequired()),
          message: "Enter feedback",
        }),
      ],
    }),
    GovUKButton({ text: "Send feedback" }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        next: [
          redirect({
            when: Query("returnTo").match(Condition.Equals("check-answers")),
            goto: "check-answers",
          }),
          redirect({ goto: "check-answers" }),
        ],
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
          key: { text: "Name" },
          value: { text: Answer("fullName") },
          actions: {
            items: [
              {
                href: "your-name?returnTo=check-answers",
                text: "Change",
                visuallyHiddenText: "name",
              },
            ],
          },
        },
        {
          key: { text: "Feedback" },
          value: { text: Answer("feedback") },
          actions: {
            items: [
              {
                href: "your-feedback?returnTo=check-answers",
                text: "Change",
                visuallyHiddenText: "role",
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
  title: "Feedback sent",
  blocks: [GovUKPanel({ titleText: "Feedback sent" })],
});

export const clientJourney = journey({
  code: "feedback",
  title: "Give feedback",
  path: "/form",
  reachability: { disableReachabilityChecks: true },
  view: { template: "partials/form-step" },
  steps: [ecfStep, feedbackStep, checkAnswersStep, confirmationStep],
});
