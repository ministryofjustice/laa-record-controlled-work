import type { createApplication } from "#/api/client/schema/applications/applications.gen.js";

export interface CreateApplicationEffectsDeps {
  createApplication: typeof createApplication;
}
