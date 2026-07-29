import type { OpenApiDocument, Options } from "@orval/core";

import "dotenv/config";

import config from "#/config.js";

import { loadGitHubOpenApiSpec } from "../scripts/loadGitHubOpenApiSpec.js";
import { sharedOutputConfig } from "./shared.orval.js";

/**
 * Creates the PDA API configuration for Orval.
 * Only called in local development (CI environment skips this).
 * @returns The PDA API Orval configuration
 */
export function createPdaConfig(): Options {
  const pdaApiSpec = loadGitHubOpenApiSpec({
    hostname: config.api.pda.spec.host,
    path: config.api.pda.spec.path,
    ref: config.api.pda.spec.ref,
    repository: config.api.pda.spec.repo,
  });

  return {
    input: {
      filters: {
        mode: "include" as const,
        schemas: ["ProviderFirmOfficeListDto"],
      },
      override: {
        transformer: (spec: OpenApiDocument): OpenApiDocument => {
          const targetPath = "/provider-firms/{firmId}/provider-offices";
          const pathItem = spec.paths?.[targetPath];
          return {
            ...spec,
            paths: pathItem ? { [targetPath]: pathItem } : {},
          };
        },
      },
      target: pdaApiSpec,
    },
    output: sharedOutputConfig("pda", "config.api.pda.baseUrl"),
  };
}
