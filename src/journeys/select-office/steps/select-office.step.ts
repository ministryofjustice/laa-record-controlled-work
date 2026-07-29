import { access, step } from "@ministryofjustice/hmpps-forge/core/authoring";

import { continueButton } from "#/journeys/common.blocks.js";
import { selectOfficeRadioInput } from "#/journeys/select-office/steps/select-office.blocks.js";
import { t } from "#/lib/i18n.js";

export const selectOfficeStep = step({
  blocks: [selectOfficeRadioInput, continueButton],
  onAccess: [
    access({
      effects: [],
    }),
  ],
  path: "/cases",
  title: t("journeys.selectOffice.title"),
});
