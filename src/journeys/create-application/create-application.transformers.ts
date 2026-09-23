import { TransformerRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";

import { normaliseNiNumber } from "#/journeys/normaliseNiNumber.js";

const createApplicationTransformersRegistry =
  new TransformerRegistry<CreateApplicationEffectsDeps>();

export const CreateApplicationTransformers = {
  normaliseNiNumber: createApplicationTransformersRegistry.register(
    "normaliseNiNumber",
    normaliseNiNumber,
  ),
};

export { createApplicationTransformersRegistry };
