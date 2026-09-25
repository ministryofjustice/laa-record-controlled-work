import { TransformerRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";

import { normaliseNiNumber } from "#/journeys/normaliseNiNumber.js";

const editApplicationTransformersRegistry =
  new TransformerRegistry<EditApplicationEffectsDeps>();

editApplicationTransformersRegistry.register(
  "normaliseNiNumber",
  normaliseNiNumber,
);

export { editApplicationTransformersRegistry };
