import {
  access,
  Data,
  step,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  createCaseButton,
  heading,
} from "#/journeys/your-cases/common.blocks.js";
import { YourCasesEffects } from "#/journeys/your-cases/effects/registry.js";
import {
  casesTable,
  noCasesMessage,
  subNavigation,
} from "#/journeys/your-cases/steps/your-cases/your-cases.blocks.js";
import { t } from "#/lib/i18n.js";

export const yourCasesStep = step({
  blocks: [
    heading,
    createCaseButton,
    subNavigation,
    casesTable(Data("caseList")),
    noCasesMessage,
  ],
  onAccess: [
    access({
      effects: [YourCasesEffects.loadYourCaseList()],
    }),
  ],
  path: "/your-cases",
  title: t("pages.yourCases.pageTitle"),
});
