import love from "eslint-config-love";
import perfectionist from "eslint-plugin-perfectionist";
import prettier from "eslint-plugin-prettier/recommended";
import globals from "globals";

import ignoresConfig from "./eslint/ignores.js";
import jsdocConfig from "./eslint/jsdoc.js";
import jsonConfigs from "./eslint/json.js";
import typescriptConfig from "./eslint/typescript.js";

export default [
  // Global ignores
  ignoresConfig,
  // Base: eslint-config-love for all JS/TS files
  { name: "love/base", ...love, files: ["**/*.js", "**/*.ts"] },
  // Global language options
  {
    name: "project/globals",
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.browser, ...globals.node },
      sourceType: "module",
    },
  },
  // TypeScript and JSDoc rules
  typescriptConfig,
  jsdocConfig,
  // Declaration files: relax strict TypeScript rules
  {
    name: "project/declaration-files",
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-empty-interface": "off", // Sometimes needed in d.ts
      "@typescript-eslint/no-explicit-any": "off", // Sometimes needed in d.ts
      "@typescript-eslint/no-namespace": "off", // Namespaces are allowed in d.ts
    },
  },
  // Sorting and import ordering
  perfectionist.configs["recommended-natural"],
  // Formatting: prettier (must be last to override any conflicting formatting rules)
  prettier,
  // JSON/JSONC linting
  ...jsonConfigs,
];
