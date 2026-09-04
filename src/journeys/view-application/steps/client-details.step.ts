import {
  access,
  step,
  type StepDefinition,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  caseReferenceNumber,
  heading,
  printButton,
  recordedOn,
  statusTag,
  subHeading,
} from "#/journeys/view-application/common.blocks.js";
import {
  aboutTheClientSummaryCard,
  caseDetailsSummaryCard,
  subNavigation,
} from "#/journeys/view-application/steps/client-details.blocks.js";
import { viewApplicationEffects } from "#/journeys/view-application/viewApplication.effects.js";
import { t } from "#/lib/i18n.js";

export const clientDetailsStep = (): StepDefinition =>
  step({
    backlink: "/cases/recorded",
    blocks: [
      statusTag("Recorded"),
      heading(),
      caseReferenceNumber(),
      recordedOn(),
      printButton(),
      subNavigation(),
      subHeading(t("pages.view.tabs.ClientDetails")),
      aboutTheClientSummaryCard(),
      caseDetailsSummaryCard(),
    ],
    onAccess: [
      access({
        effects: [viewApplicationEffects.loadCaseDetails()],
      }),
    ],
    path: "/client-details",
    reachability: {
      entryWhen: true,
    },
    title: "Client Details",
  });
