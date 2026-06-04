import type { BuildOptions } from "esbuild";

import { copy } from "esbuild-plugin-copy";
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
  "util",
  "path",
  "fs",
  "figlet",
  "csrf-sync",
  "http-errors",
  "*.node",
  "connect-redis",
  "redis",
  "pino",
];

export const appConfig = (watch = false): BuildOptions => ({
  bundle: true,
  entryPoints: ["src/server.ts"],
  external: externalModules,
  format: "esm",
  loader: { ".js": "jsx", ".json": "json", ".ts": "tsx" },
  minify: process.env.NODE_ENV === "production",
  outfile: "public/app.js",
  platform: "node",
  plugins: [
    copy({
      assets: [{ from: "src/views/**/*", to: "public/views", watch }],
      resolveFrom: "cwd",
    }),
  ],
  sourcemap: process.env.NODE_ENV !== "production",
  target: "esnext",
});
