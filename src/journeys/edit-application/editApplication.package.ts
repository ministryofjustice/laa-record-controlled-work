import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";

import { editApplicationEffectsRegistry } from "#/journeys/edit-application/editApplication.effects.js";
import { editApplicationJourney } from "#/journeys/edit-application/editApplication.journey.js";
import { editApplicationTransformersRegistry } from "#/journeys/edit-application/editApplication.transformers.js";
import { evidenceEffectsRegistry } from "#/journeys/evidence/evidence.effects.js";

export const editApplicationPackage =
  createForgePackage<EditApplicationEffectsDeps>({
    functions: [
      editApplicationEffectsRegistry,
      editApplicationTransformersRegistry,
      evidenceEffectsRegistry,
    ],
    journey: editApplicationJourney,
  });
