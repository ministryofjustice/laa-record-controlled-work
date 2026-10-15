import {
  Condition,
  Data,
  Item,
  Iterator,
  Self,
  validation,
  when,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { OFFICE_KEY } from "#/journeys/select-office/select-office.types.js";
import { t } from "#/lib/i18n.js";

const officeAddress = Item().path(OFFICE_KEY.address);
const officeHasAddress = officeAddress.match(Condition.IsRequired());

const officeItems = Data(CONTEXT_DATA_KEYS.availableOffices).each(
  Iterator.Map({
    hint: when(officeHasAddress)
      .then({ text: Item().path(OFFICE_KEY.code) })
      .else(null),
    text: when(officeHasAddress)
      .then(officeAddress)
      .else(Item().path(OFFICE_KEY.code)),
    value: Item().path(OFFICE_KEY.code),
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
  items: officeItems,
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: t("journeys.selectOffice.validation.required"),
    }),
  ],
});
