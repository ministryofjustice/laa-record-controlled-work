import { builtinModules } from "node:module";

export const NO_MORE_ASYNC_OPERATIONS = 0;
export const UNCAUGHT_FATAL_EXCEPTION = 1;
export const SECOND_IN_ARRAY = 1;

const RANDOM_NUMBER_UPPER_BOUND = 10000;

export const buildNumber = Math.floor(
  Math.random() * RANDOM_NUMBER_UPPER_BOUND,
).toString();

export interface SassPluginOptions {
  loadPaths?: string[];
  resolveDir?: string;
  transform?: (source: string) => string;
}

/**
 * List of external dependencies that should not be bundled.
 * @constant {string[]}
 */
export const externalModules: string[] = [
  ...builtinModules,
  "@azure/msal-node",
  "express",
  "nunjucks",
  "dotenv",
  "cookie-signature",
  "cookie-parser",
  "body-parser",
  "express-session",
  "morgan",
  "compression",
  "axios",
  "middleware-axios",
  "util",
  "path",
  "fs",
  "figlet",
  "csrf-sync",
  "http-errors",
  "*.node",
  "connect-redis",
  "redis",
];
