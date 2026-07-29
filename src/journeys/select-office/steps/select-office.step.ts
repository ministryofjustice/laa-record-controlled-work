import { access, step } from "@ministryofjustice/hmpps-forge/core/authoring";

import { continueButton } from "#/journeys/common.blocks.js";
import { selectOfficeEffects } from "#/journeys/select-office/select-office.effects.js";
import { selectOfficeRadioInput } from "#/journeys/select-office/steps/select-office.blocks.js";
import { t } from "#/lib/i18n.js";

export const selectOfficeStep = step({
  blocks: [selectOfficeRadioInput, continueButton],
  onAccess: [
    access({
      effects: [selectOfficeEffects.loadOffices()],
    }),
  ],
  path: "/cases",
  title: t("journeys.selectOffice.title"),
});
