import { readFileSync } from "node:fs";

import { sharedOutputConfig } from "./shared.orval.js";

const RCW_API_SHA = readFileSync(".rcw-api-version", "utf-8").trim();

/**
 * Orval configuration for the Record Controlled Work API.
 */
export const rcwConfig = {
  hooks: {
    afterAllFilesWrite: "tsx orval/fixDoubleGenImports.ts",
  },
  input: {
    filters: {
      mode: "exclude" as const,
      tags: ["items"],
    },
    target: `https://raw.githubusercontent.com/ministryofjustice/laa-record-controlled-work-api/${RCW_API_SHA}/record-controlled-work-api/open-api-specification.yml`,
  },
  output: sharedOutputConfig("rcw", "config.api.rcw.baseUrl"),
};
