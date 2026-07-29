import type { OpenApiDocument, Options } from "@orval/core";

import "dotenv/config";

import { loadGitHubOpenApiSpec } from "./loadGitHubOpenApiSpec.js";
import { sharedOutputConfig } from "./shared.orval.js";

/**
 * Creates the PDA API configuration for Orval.
 * Only called in local development (CI environment skips this).
 * @returns The PDA API Orval configuration
 */
export function createPdaConfig(): Options {
  const pdaApiSpec = loadGitHubOpenApiSpec({
    hostname: process.env.GH_HOST ?? "github.com",
    path:
      process.env.PDA_API_SPEC_PATH ??
      "providers-api/open-api-specification.yml",
    ref: process.env.PDA_API_SPEC_REF ?? "v1.51.0",
    repository:
      process.env._PDA_API_REPOSITORY ??
      "ministryofjustice/laa-data-provider-data",
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
