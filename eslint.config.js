import tsParser from "@typescript-eslint/parser";
import love from "eslint-config-love";
import jsdocPlugin from "eslint-plugin-jsdoc";
import jsoncPlugin from "eslint-plugin-jsonc";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import fs from "node:fs";

// Alter this config file to meet your project's needs and standards.

// Find dir names which are long form commit SHAs so we can ignore them.
// ministryofjustice/devsecops-actions/sca/slsa installs to a dir within
// the project root during CI which causes conflicts.
const shaDirectories = fs.readdirSync("./", { withFileTypes: true })
  .filter(dir => dir.isDirectory() && /^[0-9a-f]{40}$/.test(dir.name))
  .map(dir => `${dir.name}/`);

export default [
  {
    ...love,
    files: ["**/*.js", "**/*.ts"],
  },
  // JS/Default config (no parser override)
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  // TypeScript config (only for TS files)
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      jsdoc: jsdocPlugin,
    },
    rules: {
      "require-unicode-regexp": "off", // Don't require v flag on regexes
      "prefer-named-capture-group": "off", // Don't require named capture groups
      indent: "off", // Prettier is handling this
      "linebreak-style": "off", // Prettier is handling this
      quotes: "off", // Prettier is handling this
      semi: "off", // Prettier is handling this
      "no-console": "warn", // TODO: should be using a proper logger like pino or winston
      "no-param-reassign": [
        "error",
        {
          props: true,
          ignorePropertyModificationsFor: [
            "req", // Express request
            "request", // Express request (alternative name)
            "res", // Express response
            "response", // Express response (alternative name)
          ],
        },
      ],
      "no-negated-condition": "off", // Allow negated conditions as they can improve readability in certain contexts
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowNullableBoolean: true,
          allowString: true,
          allowNullableString: true,
          allowNullableObject: true,
        },
      ],

      // JSDoc: structural checks
      "jsdoc/check-alignment": "error",
      "jsdoc/check-param-names": "error",
      "jsdoc/check-tag-names": "error",
      "jsdoc/implements-on-classes": "error",
      "jsdoc/newline-after-description": "off",

      // JSDoc: require documentation on declarations (not inline arrows/expressions)
      "jsdoc/require-description": "error",
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
        },
      ],
      "jsdoc/require-param": "error",
      "jsdoc/require-param-description": "error",
      "jsdoc/require-param-name": "error",
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-check": "error",
      "jsdoc/require-returns-description": "error",
      // TypeScript best practices
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-extraneous-class": [
        "error",
        { allowStaticOnly: true },
      ],
      "@typescript-eslint/triple-slash-reference": [
        "error",
        { path: "never", types: "prefer-import", lib: "never" },
      ],
      // Allow destructuring from member expressions e.g. const { x } = obj.prop
      // Accepted tradeoff - this won't error either: const x = obj.prop.x
      "@typescript-eslint/prefer-destructuring": [
        "error",
        { array: true, object: true },
        {
          enforceForRenamedProperties: false,
          enforceForDeclarationWithTypeAnnotation: false,
        },
      ],
      "@typescript-eslint/init-declarations": "off", // Allow uninitialised declarations e.g. before try/catch
    },
  },
  // Add a separate config for declaration files
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Sometimes needed in d.ts
      "@typescript-eslint/no-empty-interface": "off", // Sometimes needed in d.ts
      "@typescript-eslint/no-namespace": "off", // Namespaces are allowed in d.ts
    },
  },
  // Add prettier for automated, standardised formatting
  eslintPluginPrettier,
  // JSON linting
  ...jsoncPlugin.configs["flat/recommended-with-json"],
  // tsconfig and VS Code config files are JSONC (JSON with Comments) — allow comments in them
  {
    files: ["**/tsconfig*.json", ".vscode/*.json"],
    rules: {
      "jsonc/no-comments": "off",
    },
  },
  // Disable jsonc formatting rules that conflict with Prettier
  ...jsoncPlugin.configs["flat/prettier"],
  // Ignore patterns
  {
    ignores: [
      ...shaDirectories,
      "node_modules/*",
      "public/*",
      "tests/**/*.spec.ts", // Unit test specs (if any remain in tests/)
      "tests/playwright/**/*.spec.ts", // E2E test specs in new Playwright structure
      "tests/playwright/fixtures/*", // Test fixtures
      "tests/playwright/factories/*", // Test factories and mock handlers
      "tests/playwright/pages/*", // Page object models
      "tests/playwright/utils/*", // Test utilities and helpers
      "tests/playwright/playwright.config.ts", // Playwright configuration file
      "tests/helpers/*", // Test helper utilities (if any remain)
      "docs/source/javascripts/application.js", // Parsing error this file was not found by the project service. Consider either including it in the `tsconfig.json` or including it in `allowDefaultProject`
      "docs/source/javascripts/govuk_frontend.js", // Documentation JavaScript file, not part of main TypeScript project
      "eslint.config.js", // Parsing error this file was not found by the project service. Consider either including it in the `tsconfig.json` or including it in `allowDefaultProject`,
      "coverage", // Ignore the code coverage output from linter
      "scripts/e2e_coverage/*", // Route coverage analysis scripts
      "public/assets/manifest.json", // Build artifact
      "yarn.lock", // Not JSON
    ],
  },
];
