import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";

import { editClientDetailsEffectsRegistry } from "#/journeys/edit-client-details/editClientDetails.effects.js";
import { editClientDetailsJourney } from "#/journeys/edit-client-details/editClientDetails.journey.js";

export const editClientDetailsPackage =
  createForgePackage<EditApplicationEffectsDeps>({
    functions: [editClientDetailsEffectsRegistry],
    journey: editClientDetailsJourney,
  });
