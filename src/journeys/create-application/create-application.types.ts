import type { createApplication } from "#/api/clients/rcw/schema/applications/applications.gen.js";

export interface CreateApplicationEffectsDeps {
  createApplication: typeof createApplication;
}
