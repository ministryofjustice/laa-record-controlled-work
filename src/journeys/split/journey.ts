import {
  journey,
  step,
  submit,
  redirect,
  Answer,
  Condition,
  validation,
  Self,
  block,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKTextareaInput,
  GovUKButton,
  GovUKRadioInput,
  GovUKPanel,
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
        when: Answer('ecf').match(Condition.Equals('yes')),
        goto: 'yes',
      }),
      redirect({ goto: 'no' }),
        ],
      },
    }),
  ],
});

const yesStep = step({
  path: "/yes",
  title: "Yes option",
  blocks: [
    GovUKTextareaInput({
      code: "yes",
      label: {
        text: "You picked yes",
        isPageHeading: true,
        classes: "govuk-label--l",
      },
      validWhen: [
        validation({
          condition: Self().match(Condition.IsRequired()),
          message: "Enter some text",
        }),
      ],
    }),
    GovUKButton({ text: "Send" }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        next: [
          redirect({ goto: "confirmation" }),
        ],
      },
    }),
  ],
});

const noStep = step({
  path: "/no",
  title: "No option",
  blocks: [
    GovUKTextareaInput({
      code: "no",
      label: {
        text: "You picked no",
        isPageHeading: true,
        classes: "govuk-label--l",
      },
      validWhen: [
        validation({
          condition: Self().match(Condition.IsRequired()),
          message: "Enter some text",
        }),
      ],
    }),
    GovUKButton({ text: "Send" }),
  ],
  onSubmission: [
    submit({
      validate: true,
      onValid: {
        next: [
          redirect({ goto: "confirmation" }),
        ],
      },
    }),
  ],
});

const confirmationStep = step({
  path: "/confirmation",
  title: "Form sent",
  blocks: [GovUKPanel({ titleText: "Feedback sent" })],
});

export const splitJourney = journey({
  code: "feedback",
  title: "Give feedback",
  path: "/split-form",
  reachability: { disableReachabilityChecks: true },
  view: { template: "partials/form-step" },
  steps: [ecfStep, yesStep, noStep, confirmationStep ],
});
