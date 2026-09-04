import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";

import { editClientDetailsJourney } from "#/journeys/edit-client-details/editClientDetails.journey.js";
import { editClientDetailsEffectsRegistry } from "#/journeys/edit-client-details/editClientDetails.effects.js";

export const editClientDetailsPackage =
  createForgePackage<EditApplicationEffectsDeps>({
    functions: [editClientDetailsEffectsRegistry],
    journey: editClientDetailsJourney,
  });
