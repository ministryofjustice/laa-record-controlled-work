import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { ViewApplicationEffectsDeps } from "#/journeys/view-application/viewApplication.types.js";

import { loadCaseDetails } from "#/journeys/view-application/effects/loadCaseDetails.js";

export const viewApplicationEffectsRegistry =
  new EffectRegistry<ViewApplicationEffectsDeps>();

export const viewApplicationEffects = {
  loadCaseDetails: viewApplicationEffectsRegistry.register(loadCaseDetails),
};
