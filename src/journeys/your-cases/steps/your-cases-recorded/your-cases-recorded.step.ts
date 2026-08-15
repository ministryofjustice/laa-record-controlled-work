import {
  access,
  Data,
  step,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import {
  createCaseButton,
  heading,
  selectedOfficeMultiple,
  selectedOfficeSingle,
} from "#/journeys/your-cases/common.blocks.js";
import {
  casesTable,
  noCasesMessage,
  subNavigation,
} from "#/journeys/your-cases/steps/your-cases-recorded/your-cases-recorded.blocks.js";
import { yourCasesEffects } from "#/journeys/your-cases/your-cases.effects.js";
import { t } from "#/lib/i18n.js";

export const yourCasesRecordedStep = step({
  blocks: [
    heading,
    selectedOfficeSingle,
    selectedOfficeMultiple,
    createCaseButton,
    subNavigation,
    casesTable(Data(CONTEXT_DATA_KEYS.caseList)),
    noCasesMessage,
  ],
  onAccess: [
    access({
      effects: [yourCasesEffects.loadYourCaseList("COMPLETED")],
    }),
  ],
  path: "/cases/recorded",
  title: t("pages.yourCases.pageTitle"),
});
