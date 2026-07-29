import { access, step } from "@ministryofjustice/hmpps-forge/core/authoring";

import { t } from "#/lib/i18n.js";

export const yourCasesStep = step({
  blocks: [],
  onAccess: [
    access({
      effects: [],
    }),
  ],
  path: "/cases",
  title: t("journeys.selectOffice.title"),
});
