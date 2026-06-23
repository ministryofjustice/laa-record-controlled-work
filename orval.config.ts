import { defineConfig } from "orval";

export default defineConfig({
  test: {
    hooks: {
      afterAllFilesWrite: "make lint-fix-api",
    },
    input: {
      target: "./src/api/rcw-open-api-spec.yml",
    },
    output: {
      client: "zod",
      mock: {
        generators: [{ type: "msw" }, { type: "faker" }],
      },
      mode: "split",
      schemas: {
        path: "./src/api/generated/model",
        type: "zod",
      },
      target: "./src/api/generated/schema",
    },
  },
});
