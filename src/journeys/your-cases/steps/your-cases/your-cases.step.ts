import { Data, step } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { Case } from "#/journeys/your-cases/journey.types.js";

import {
  casesTable,
  createCaseButton,
  heading,
  subNavigation,
} from "#/journeys/your-cases/steps/your-cases/your-cases.blocks.js";

export const yourCasesStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      heading,
      createCaseButton,
      subNavigation,
      casesTable(Data("caseList")),
    ],
    path: "/",
    title: "Your Cases",
  });
