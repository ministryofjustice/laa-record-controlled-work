import {
  access,
  Data,
  step,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import {
  createCaseButton,
  heading,
  selectedOffice,
} from "#/journeys/your-cases/common.blocks.js";
import {
  casesTable,
  noCasesMessage,
  subNavigation,
} from "#/journeys/your-cases/steps/your-cases-recorded/your-cases-recorded.blocks.js";
import { YourCasesEffects } from "#/journeys/your-cases/your-cases.effects.js";
import { t } from "#/lib/i18n.js";

export const yourCasesRecordedStep = step({
  blocks: [
    heading,
    selectedOffice,
    createCaseButton,
    subNavigation,
    casesTable(Data(CONTEXT_DATA_KEYS.caseList)),
    noCasesMessage,
  ],
  onAccess: [
    access({
      effects: [
        YourCasesEffects.loadYourCaseList(),
        YourCasesEffects.setSelectedOffice(),
      ],
    }),
  ],
  path: "/cases/recorded",
  title: t("pages.yourCases.pageTitle"),
});
