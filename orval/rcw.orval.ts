import { readFileSync } from "node:fs";

import { mapResponseErrorsToSharedSchema } from "./fixRcwResponseAliases.js";
import { sharedOutputConfig } from "./shared.orval.js";

const RCW_API_SHA = readFileSync(".rcw-api-version", "utf-8").trim();
const rcwOutput = sharedOutputConfig("rcw", "config.api.rcw.baseUrl");

rcwOutput.override = {
  ...rcwOutput.override,
  transformer: mapResponseErrorsToSharedSchema,
};

/**
 * Orval configuration for the Record Controlled Work API.
 */
export const rcwConfig = {
  hooks: {
    afterAllFilesWrite: [
      "tsx orval/fixDoubleGenImports.ts",
      "tsx orval/fixSchemaAliasExtensions.ts",
      "tsx orval/fixNinoFakerRegex.ts",
    ],
  },
  input: {
    parserOptions: {
      externalRefs: {
        allow: ["*"],
      },
    },
    target: `https://raw.githubusercontent.com/ministryofjustice/laa-record-controlled-work-api/${RCW_API_SHA}/record-controlled-work-api/open-api-specification.yml`,
  },
  output: rcwOutput,
};
