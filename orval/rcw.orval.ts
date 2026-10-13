import { faker } from "@faker-js/faker";
import { readFileSync } from "node:fs";

import { sharedOutputConfig } from "./shared.orval.js";

const RCW_API_SHA = readFileSync(".rcw-api-version", "utf-8").trim();
const rcwOutput = sharedOutputConfig("rcw", "config.api.rcw.baseUrl");

/**
 * Orval configuration for the Record Controlled Work API.
 */
export const rcwConfig = {
  hooks: {
    afterAllFilesWrite: [
      "tsx orval/fixDoubleGenImports.ts",
      "tsx orval/fixSchemaAliasExtensions.ts",
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
  output: {
    ...rcwOutput,
    override: {
      ...rcwOutput.override,
      mock: {
        ...rcwOutput.override?.mock,
        properties: {
          niNumber: () => faker.helpers.fromRegExp("AA[0-9]{6}[A-D]"),
        },
      },
    },
  },
};
