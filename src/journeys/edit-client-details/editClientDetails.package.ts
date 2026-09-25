import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";

import { editApplicationEffectsRegistry } from "#/journeys/edit-application/editApplication.effects.js";
import { editClientDetailsJourney } from "#/journeys/edit-client-details/editClientDetails.journey.js";

export const editClientDetailsPackage =
  createForgePackage<EditApplicationEffectsDeps>({
    functions: [editApplicationEffectsRegistry],
    journey: editClientDetailsJourney,
  });
