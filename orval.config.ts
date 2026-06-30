import { config } from "dotenv";
import { defineConfig } from "orval";

config({ path: ".rcw-api-version.env" });

export default defineConfig({
  rcw: {
    // commands to run after generating files, e.g. to run a linter or formatter
    hooks: {
      afterAllFilesWrite: "make lint-fix",
    },
    input: {
      filters: {
        mode: "exclude",
        tags: ["items"],
      },
      target: `https://raw.githubusercontent.com/ministryofjustice/laa-record-controlled-work-api/${process.env.API_GITHUB_SHA}/record-controlled-work-api/open-api-specification.yml`,
    },
    output: {
      clean: true,
      client: "fetch",
      fileExtension: ".gen.ts",
      indexFiles: false,
      mock: {
        generators: [{ type: "msw" }, { type: "faker" }],
      },
      mode: "tags-split",
      // custom fetch function to use instead of the default fetch implementation
      override: {
        mutator: {
          name: "fetcher",
          path: "./src/api/lib/fetch.ts",
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
