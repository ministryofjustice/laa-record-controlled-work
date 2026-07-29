import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { SelectOfficeEffectsDeps } from "#/journeys/select-office/select-office.types.js";

export const selectOfficeEffectsRegistry =
  new EffectRegistry<SelectOfficeEffectsDeps>();

export const selectOfficeEffects = {};
