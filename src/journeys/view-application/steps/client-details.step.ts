import {
  access,
  step,
  StepDefinition,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { subNavigation } from "#/journeys/view-application/steps/client-details.blocks.js";
import {
  caseReferenceNumber,
  heading,
  printButton,
  recordedOn,
  statusTag,
} from "#/journeys/view-application/common.blocks.js";
import { viewApplicationEffects } from "#/journeys/view-application/viewApplication.effects.js";

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
