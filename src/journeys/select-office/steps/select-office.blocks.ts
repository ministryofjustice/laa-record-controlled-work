import {
  Condition,
  Data,
  Format,
  Item,
  Iterator,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { OFFICE_FIELD } from "#/journeys/select-office/select-office.types.js";
import { t } from "#/lib/i18n.js";

const officeItems = Data(CONTEXT_DATA_KEYS.officeList).each(
  Iterator.Map({
    hint: {
      text: Item().path(OFFICE_FIELD.postCode),
    },
    text: Format(
      "%1, %2",
      Item().path(OFFICE_FIELD.officeName),
      Item().path(OFFICE_FIELD.address),
    ),
    value: Item(),
  }),
);

export const selectOfficeRadioInput = GovUKRadioInput({
  code: "selectOffice",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--l",
      isPageHeading: true,
      text: t("journeys.selectOffice.title"),
    },
  },
  // TODO fix type issue
  // @ts-expect-error Forge runtime supports dynamic iterable expressions for items
  items: officeItems,
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: t("journeys.selectOffice.validation.required"),
    }),
  ],
});
