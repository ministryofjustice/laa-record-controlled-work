import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { ViewApplicationEffectsDeps } from "#/journeys/view-application/viewApplication.types.js";
import { viewApplicationEffectsRegistry } from "#/journeys/view-application/viewApplication.effects.js";
import { viewApplicationJourney } from "#/journeys/view-application/viewApplication.journey.js";

export const viewApplicationPackage =
  createForgePackage<ViewApplicationEffectsDeps>({
    functions: [viewApplicationEffectsRegistry],
    journey: viewApplicationJourney,
  });
