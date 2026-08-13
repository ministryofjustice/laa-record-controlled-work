import {
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { continueButton } from "#/journeys/common.blocks.js";
import { selectOfficeEffects } from "#/journeys/select-office/select-office.effects.js";
import { selectOfficeRadioInput } from "#/journeys/select-office/steps/select-office.blocks.js";
import { t } from "#/lib/i18n.js";

export const selectOfficeStep = step({
  blocks: [selectOfficeRadioInput, continueButton],
  onSubmission: [
    submit({
      onValid: {
        effects: [selectOfficeEffects.setSelectedOffice()],
        next: [redirect({ goto: "/" })],
      },
      validate: true,
    }),
  ],
  path: "/",
  title: t("journeys.selectOffice.title"),
});
