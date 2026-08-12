import fs from "node:fs";

// Find dir names which are long form commit SHAs so we can ignore them.
// ministryofjustice/devsecops-actions/sca/slsa installs to a dir within
// the project root during CI which causes conflicts.
const shaDirectories = fs
  .readdirSync("./", { withFileTypes: true })
  .filter((dir) => dir.isDirectory() && /^[0-9a-f]{40}$/.test(dir.name))
  .map((dir) => `${dir.name}/`);

export default {
  name: "project/ignores",
  ignores: [
    ...shaDirectories,
    "node_modules/*",
    "public/*",
    "**/*.gen.ts", // Generated TypeScript artifacts
    "eslint.config.js", // Parsing error: not found by the project service
    "eslint/**", // ESLint config split files
    "coverage",
    "playwright-report/**", // Generated Playwright HTML report assets
    "test-results/**", // Generated Playwright run artifacts
    "tests/**/*.spec.ts", // Unit test specs (if any remain in tests/)
    "tests/ui/**/*.spec.ts",
    "tests/ui/fixtures/*",
    "tests/ui/factories/*",
    "tests/ui/pages/*",
    "tests/ui/utils/*",
    "tests/ui/playwright.config.ts",
    "tests/helpers/*", // Test helper utilities (if any remain)
    "tests/integration/utils/*", // Integration test utilities and helpers
    "docs/source/javascripts/application.js", // Parsing error: not found by the project service
    "docs/source/javascripts/govuk_frontend.js", // Documentation JavaScript file, not part of main TypeScript project
    "scripts/e2e_coverage/*", // Route coverage analysis scripts
    "public/assets/manifest.json", // Build artifact
    "yarn.lock", // Not JSON
    "src/api/clients/**" // Generated API client code, not manually edited
  ],
};
