import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";

import {
  editApplicationEffects,
  editApplicationEffectsRegistry,
} from "#/journeys/edit-application/editApplication.effects.js";
import { editApplicationTransformersRegistry } from "#/journeys/edit-application/editApplication.transformers.js";
import { editClientDetailsJourney } from "#/journeys/edit-client-details/editClientDetails.journey.js";

export const editClientDetailsEffects = editApplicationEffects;
export const editClientDetailsEffectsRegistry = editApplicationEffectsRegistry;

export const editClientDetailsPackage =
  createForgePackage<EditApplicationEffectsDeps>({
    functions: [
      editClientDetailsEffectsRegistry,
      editApplicationTransformersRegistry,
    ],
    journey: editClientDetailsJourney,
  });
