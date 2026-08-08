import type { Options } from "@orval/core";

import { faker } from "@faker-js/faker";
import "dotenv/config";

import { loadGitHubOpenApiSpec } from "./loadGitHubOpenApiSpec.js";
import { pdaTransformer } from "./pda.transformer.js";
import { sharedOutputConfig } from "./shared.orval.js";

// Overrides for fields rendered in the UI (e.g. select-office)
//
// Functions are stringified and spliced into the generated mock file, where
// `faker` resolves against that file's own `@faker-js/faker` import.
// Don't reference identifiers from this module.
const PDA_MOCK_PROPERTIES: Record<string, () => unknown> = {
  addressLine1: () => faker.location.streetAddress(),
  addressLine2: () => null,
  addressLine3: () => null,
  addressLine4: () => null,
  city: () => faker.location.city(),
  firmName: () => faker.company.name(),
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- intuitive
  firmOfficeCode: () => faker.string.alphanumeric(6).toUpperCase(),
  postCode: () =>
    faker.helpers.fromRegExp("[A-Z]{1,2}[0-9][0-9A-Z]? [0-9][A-Z]{2}"),
};

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

  const pdaOutput = sharedOutputConfig("pda", "config.api.pda.baseUrl");

  return {
    hooks: {
      afterAllFilesWrite: [
        "tsx orval/convertOptionalToNullish.ts",
        "tsx orval/fixDoubleGenImports.ts",
      ],
    },
    input: {
      filters: {
        mode: "include" as const,
        schemas: ["ProviderFirmOfficeListDto"],
      },
      override: {
        transformer: pdaTransformer,
      },
      target: pdaApiSpec,
    },
    output: {
      ...pdaOutput,
      override: {
        ...pdaOutput.override,
        mock: {
          ...pdaOutput.override?.mock,
          properties: PDA_MOCK_PROPERTIES,
        },
      },
    },
  };
}
