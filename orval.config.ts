import { defineConfig } from "orval";

export default defineConfig({
  rcw: {
    // commands to run after generating files, e.g. to run a linter or formatter
    // hooks: {
    //   afterAllFilesWrite: "lint-fix",
    // },
    input: {
      // target can be a local file path or a remote URL
      target: "./src/api/rcw-open-api-spec.yml",
    },
    output: {
      baseUrl: "http://localhost:8081",
      clean: true,
      client: "fetch",
      formatter: "prettier",
      indexFiles: false,
      mock: {
        generators: [{ type: "msw" }, { type: "faker" }],
      },
      mode: "tags-split",
      // custom fetch function to use instead of the default fetch implementation
      // override: {
      //   mutator: {
      //     name: "customFetch",
      //     path: "./src/api/customFetch.ts",
      //   },
      // },
      schemas: {
        path: "./src/api/generated/model",
        type: "zod",
      },
      target: "./src/api/generated/schema",
      tsconfig: "./tsconfig.json",
    },
  },
});
