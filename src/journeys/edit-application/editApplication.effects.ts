import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";

import { closeIneligibleCase } from "#/journeys/edit-application/effects/closeIneligibleCase.js";
import { loadApplication } from "#/journeys/edit-application/effects/loadApplication.js";
import { setTaskListStatuses } from "#/journeys/edit-application/effects/setTaskListStatuses.js";
import { submitApplication } from "#/journeys/edit-application/effects/submitApplication.js";
import { loadApplicationAsAnswers } from "#/journeys/edit-client-details/effects/loadApplicationAsAnswers.js";
import { updateClientDetails } from "#/journeys/edit-client-details/effects/updateClientDetails.js";
import { loadEvidenceAsAnswers } from "#/journeys/evidence/effects/loadEvidenceAsAnswers.js";
import { clearAllDraftAnswers } from "#/journeys/effects/clearAllDraftAnswers.js";
import { clearFieldAnswers } from "#/journeys/effects/clearFieldAnswers.js";
import { loadDraftAnswers } from "#/journeys/effects/loadDraftAnswers.js";
import { saveDraftAnswers } from "#/journeys/effects/saveDraftAnswers.js";

export const editApplicationEffectsRegistry =
  new EffectRegistry<EditApplicationEffectsDeps>();

export const editApplicationEffects = {
  clearAllDraftAnswers:
    editApplicationEffectsRegistry.register(clearAllDraftAnswers),
  clearFieldAnswers: editApplicationEffectsRegistry.register(clearFieldAnswers),
  closeIneligibleCase:
    editApplicationEffectsRegistry.register(closeIneligibleCase),
  loadApplication: editApplicationEffectsRegistry.register(loadApplication),
  loadApplicationAsAnswers: editApplicationEffectsRegistry.register(
    loadApplicationAsAnswers,
  ),
  loadEvidenceAsAnswers: editApplicationEffectsRegistry.register(
    loadEvidenceAsAnswers
  ),
  loadDraftAnswers: editApplicationEffectsRegistry.register(loadDraftAnswers),
  saveDraftAnswers: editApplicationEffectsRegistry.register(saveDraftAnswers),
  setTaskListStatuses:
    editApplicationEffectsRegistry.register(setTaskListStatuses),
  submitApplication: editApplicationEffectsRegistry.register(submitApplication),
  updateClientDetails:
    editApplicationEffectsRegistry.register(updateClientDetails),
};
