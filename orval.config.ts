import { readFileSync } from "node:fs";
import { defineConfig } from "orval";

const API_SHA = readFileSync(".rcw-api-version", "utf-8").trim();

export default defineConfig({
  rcw: {
    input: {
      filters: {
        mode: "exclude",
        tags: ["items"],
      },
      target: `https://raw.githubusercontent.com/ministryofjustice/laa-record-controlled-work-api/${API_SHA}/record-controlled-work-api/open-api-specification.yml`,
    },
    output: {
      clean: true,
      client: "fetch",
      fileExtension: ".gen.ts",
      formatter: "prettier",
      indexFiles: false,
      mock: {
        generators: [
          { path: "./tests/mocks/api/msw", type: "msw" },
          { path: "./tests/mocks/api/fakers", type: "faker" },
        ],
      },
      mode: "tags-split",
      // custom fetch function to use instead of the default fetch implementation
      override: {
        mutator: {
          extension: ".js",
          name: "fetcher",
          path: "./src/lib/fetch.ts",
        },
      },
      schemaFileExtension: ".zod.gen.ts",
      schemas: {
        path: "./src/api/client/model",
        type: "zod",
      },
      target: "./src/api/client/schema",
      tsconfig: "./tsconfig.json",
    },
  },
});
