import type {
  HtmlBlock,
  ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";

import {
  Condition,
  Self,
  validation,
  type ValidationExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  GovUKButton,
  GovUKTextInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { t } from "i18next";

import { UK_ADDRESS_FIELDS } from "#/journeys/journey.constants.js";

const LINE_1_CODE = UK_ADDRESS_FIELDS.addressLine1;
const LINE_1_LABEL = t(
  "journeys.createApplication.enterAddressManually.addressLine1.label",
);
const LINE_1_VALIDATION = t(
  "journeys.createApplication.enterAddressManually.addressLine1.validation.required",
);
const LINE_2_CODE = UK_ADDRESS_FIELDS.addressLine2;
const LINE_2_LABEL = t(
  "journeys.createApplication.enterAddressManually.addressLine2.label",
);

const TOWN_CITY_CODE = UK_ADDRESS_FIELDS.townOrCity;
const TOWN_CITY_LABEL = t(
  "journeys.createApplication.enterAddressManually.townOrCity.label",
);
const TOWN_CITY_VALIDATION = t(
  "journeys.createApplication.enterAddressManually.townOrCity.validation.required",
);

const COUNTY_CODE = UK_ADDRESS_FIELDS.county;
const COUNTY_LABEL = t(
  "journeys.createApplication.enterAddressManually.county.label",
);

const COUNTRY_CODE = UK_ADDRESS_FIELDS.country;


const POSTCODE_CODE = UK_ADDRESS_FIELDS.postcode;
const POSTCODE_LABEL = t(
    "journeys.createApplication.enterAddressManually.postcode.label",
);
const POSTCODE_REQUIRED_VALIDATION = t(
    "journeys.createApplication.enterAddressManually.postcode.validation.required",
);
const POSTCODE_INVALID_VALIDATION = t(
    "journeys.createApplication.enterAddressManually.postcode.validation.invalid",
);

const NON_UK_ADDRESS_TEXT = t(
    "journeys.createApplication.enterAddressManually.nonUkAddress",
);
const CONTINUE_TEXT = t("common.continue");

// TODO move this to shared.hooks, and replace others with this shared hook
/**
 * Creates a required-field validation rule for a GOV.UK form field.
 *
 * @param validationMessage - The translated error message shown when the field is empty.
 * @returns A validation expression that fails if the answer is blank.
 */
function answerIsRequired(validationMessage: ResolvableString): ValidationExpr {
  return validation({
    condition: Self().match(Condition.IsRequired()),
    message: validationMessage,
  });
}


// TODO this textInput moves to shared.blocks.ts
/**
 * Builds a GOV.UK text input block for an address field.
 *
 * @param code - The field code used to store the answer.
 * @param labelText - The visible label for the input.
 * @param options - Optional rendering and validation settings for the field.
 * @param options.classes - Additional GOV.UK CSS classes to apply to the input.
 * @param options.defaultValue - Initial value to pre-populate in the field.
 * @param options.validations - Validation requirements to apply to the field.
 * @returns A GOV.UK text input block configured for the supplied field.
 */
function textInput(
  code: string,
  labelText: string,
  options?: {
    classes?: string;
    defaultValue?: string;
    validations?: ValidationExpr[];
  },
): GovUKTextInput {
  return GovUKTextInput({
    classes: options?.classes,
    code,
    defaultValue: options?.defaultValue,
    label: {
      isPageHeading: false,
      text: labelText,
    },
    validWhen: options?.validations,
  });
}

const addressLine1 = textInput(LINE_1_CODE, LINE_1_LABEL, {
  validations: [answerIsRequired(LINE_1_VALIDATION)],
});
const addressLine2 = textInput(LINE_2_CODE, LINE_2_LABEL);

const townOrCity = textInput(TOWN_CITY_CODE, TOWN_CITY_LABEL, {
  classes: "govuk-!-width-two-thirds",
  validations: [answerIsRequired(TOWN_CITY_VALIDATION)],
});

const county = textInput(COUNTY_CODE, COUNTY_LABEL, {
  classes: "govuk-!-width-two-thirds",
});

const country = textInput(COUNTRY_CODE, "", {
  classes:
    "govuk-input--width-10 govuk-!-display-none govuk-!-visibility-hidden",
  defaultValue: "United Kingdom",
});

const postcode = textInput(POSTCODE_CODE, POSTCODE_LABEL, {
  classes: "govuk-input--width-10",
  validations: [
    answerIsRequired(POSTCODE_REQUIRED_VALIDATION),
    validation({
      condition: Self().match(Condition.Address.IsValidPostcode()),
      message: POSTCODE_INVALID_VALIDATION,
    }),
  ],
});

// GovUKTextInput({
//   classes: "govuk-input--width-10",
//   code: UK_ADDRESS_FIELDS.postcode,
//   label: {
//     isPageHeading: false,
//     text: t(
//       "journeys.createApplication.enterAddressManually.postcode.label",
//     ),
//   },
//   validWhen: [
//     validation({
//       condition: Self().match(Condition.IsRequired()),
//       message: t(
//         "journeys.createApplication.enterAddressManually.postcode.validation.required",
//       ),
//     }),
//     validation({
//       condition: Self().match(Condition.Address.IsValidPostcode()),
//       message: t(
//         "journeys.createApplication.enterAddressManually.postcode.validation.invalid",
//       ),
//     }),
//   ],
// }),

const addressInputs = [
  addressLine1,
  addressLine2,
  townOrCity,
  county,
  postcode,
  country,
];


const nonUkAddressLink = HtmlBlock({
  content: `<p class="govuk-body"><a class="govuk-link" href="enter-overseas-address">${NON_UK_ADDRESS_TEXT}</a></p>`,
});

const continueButton = GovUKButton({ text: CONTINUE_TEXT });

export const enterAddressManuallyBlocks = [
  ...addressInputs,
  nonUkAddressLink,
  continueButton,
];

//const nonUkAddressLink = "TODO";
// HtmlBlock({
//   content: `<p class="govuk-body"><a class="govuk-link" href="enter-overseas-address">${t("journeys.createApplication.enterAddressManually.nonUkAddress")}</a></p>`,
// }),

// GovUKButton({ text: t("common.continue") }),
//   function HtmlBlock(arg0: { content: string; }) {
//     throw new Error("Function not implemented.");
//   }
