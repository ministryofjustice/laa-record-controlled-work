import type { BuildOptions } from "esbuild";

import { builtinModules } from "node:module";

const externalModules: string[] = [
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

export const appConfig = (): BuildOptions => ({
  bundle: true,
  entryPoints: ["src/server.ts"],
  external: externalModules,
  format: "esm",
  loader: { ".js": "jsx", ".json": "json", ".ts": "tsx" },
  minify: process.env.NODE_ENV === "production",
  outfile: "public/app.js",
  platform: "node",
  sourcemap: process.env.NODE_ENV !== "production",
  target: "esnext",
});
