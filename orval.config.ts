import { defineConfig } from "orval";

export default defineConfig({
  rcw: {
    // commands to run after generating files, e.g. to run a linter or formatter
    // hooks: {
    //   afterAllFilesWrite: "make lint-fix-api",
    // },
    input: {
      // target can be a local file path or a remote URL
      target: "./src/api/rcw-open-api-spec.yml",
    },
    output: {
      baseUrl: "http://localhost:3000",
      clean: true,
      client: "fetch",
      // formatter: "prettier",
      mock: {
        generators: [{ type: "msw" }, { type: "faker" }],
      },
      mode: "tags-split",
      // custom fetch function to use instead of the default fetch implementation
      override: {
        mutator: {
          name: "customFetch",
          path: "./src/api/customFetch.ts",
        },
      },
      schemas: {
        path: "./src/api/generated/model",
        type: "zod",
      },
      target: "./src/api/generated/schema",
    },
  },
});
