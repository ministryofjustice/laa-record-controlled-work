import {
  access,
  Data,
  Format,
  step,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  APPLICATION_DATA_KEYS,
  APPLICATIONS_DATA_KEYS,
  CLIENT_DETAILS_DATA_KEYS,
  CONTEXT_DATA_KEYS,
} from "#/journeys/journey.constants.js";
import {
  caseReferenceNumber,
  heading,
  printButton,
  recordedOn,
  statusTag,
} from "#/journeys/view-application/steps/client-details.blocks.js";
import { viewApplicationEffects } from "#/journeys/view-application/viewApplication.effects.js";

const referenceNumber = Data(CONTEXT_DATA_KEYS.application).path(
  APPLICATION_DATA_KEYS.applicationRefNumber,
);

const recordedOnDate = Data(CONTEXT_DATA_KEYS.application)
  .path(APPLICATIONS_DATA_KEYS.modifiedAt)
  .pipe(
    Transformer.String.FormatDate({
      day: "numeric",
      locale: "en-GB",
      month: "short",
      timeZone: "Europe/London",
      year: "numeric",
    }),
  );

const clientName = Format(
  "%1 %2",
  Data(CONTEXT_DATA_KEYS.application).path(CLIENT_DETAILS_DATA_KEYS.firstName),
  Data(CONTEXT_DATA_KEYS.application).path(CLIENT_DETAILS_DATA_KEYS.lastName),
);

export const clientDetailsStep = (): ReturnType<typeof step> =>
  step({
    backlink: "/cases/recorded",
    blocks: [
      statusTag("Recorded"),
      heading(clientName),
      caseReferenceNumber(referenceNumber),
      recordedOn(recordedOnDate),
      printButton(),
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
