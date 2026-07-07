import {
  access,
  Data,
  step,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { t } from "#/lib/i18n.js";

import {
  casesTable,
  createCaseButton,
  heading,
  noCasesMessage,
  subNavigation,
} from "#/journeys/your-cases/steps/your-cases/your-cases.blocks.js";
import { YourCasesEffects } from "#/journeys/your-cases/your-cases.effects.js";

export const yourCasesStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      heading,
      createCaseButton,
      subNavigation,
      // TODO create transformer mapper and test
      casesTable(Data("caseList")),
      noCasesMessage,
    ],
    onAccess: [
      access({
        effects: [YourCasesEffects.LoadYourCaseList()],
      }),
    ],
    path: "/",
    title: t("yourCases.pageTitle"),
  });
