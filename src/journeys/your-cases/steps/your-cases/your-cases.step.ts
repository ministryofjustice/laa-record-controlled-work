
import { Data, step, access } from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  casesTable,
  createCaseButton,
  heading,
  noCasesMessage,
  subNavigation,
} from "#/journeys/your-cases/steps/your-cases/your-cases.blocks.js";
import { YourCasesEffects } from "#/journeys/your-cases/your-cases.effects.js";
import { t } from "i18next";

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
    title: t("yourCases.title"),
  });
