import { TransformerRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";

const createApplicationTransformersRegistry =
  new TransformerRegistry<CreateApplicationEffectsDeps>();

export const CreateApplicationTransformers = {
  normaliseNiNumber: createApplicationTransformersRegistry.register(
    "normaliseNiNumber",
    () => (value: unknown) => {
      if (typeof value !== "string") {
        throw new TypeError("normaliseNiNumber expects a string");
      }

      return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    },
  ),
};

export { createApplicationTransformersRegistry };
