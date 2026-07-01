import { Data, step } from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  casesTable,
  createCaseButton,
  heading,
  subNavigation,
} from "#/journeys/your-cases/steps/your-cases/your-cases.blocks.js";
import { Case } from "#/journeys/your-cases/journey.types.js";

export const yourCasesStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      heading,
      createCaseButton,
      subNavigation,
      casesTable(Data("caseList") as unknown as Case[]),
    ],
    path: "/",
    title: "Your Cases",
  });
