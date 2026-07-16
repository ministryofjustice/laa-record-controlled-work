import {
  access,
  Data,
  step,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  casesTable,
  noCasesMessage,
  subNavigation,
} from "#/journeys/your-cases/steps/your-cases-ineligible/your-cases-ineligible.blocks.js";
import { createCaseButton, heading } from "#/journeys/your-cases/common.blocks.js";

import { YourCasesEffects } from "#/journeys/your-cases/your-cases.effects.js";
import { t } from "#/lib/i18n.js";

export const yourCasesIneligibleStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      heading,
      createCaseButton,
      subNavigation,
      casesTable(Data("caseList")),
      noCasesMessage,
    ],
    onAccess: [
      access({
        effects: [YourCasesEffects.LoadYourCaseList()],
      }),
    ],
    path: "/your-cases-ineligible",
    title: t("pages.yourCases.pageTitle"),
  });
