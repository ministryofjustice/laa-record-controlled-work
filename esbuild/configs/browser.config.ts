import type { BuildOptions } from "esbuild";

import { cleanPlugin } from "../plugins/clean.plugin.js";

export const browserConfigs = (): BuildOptions[] => [
  {
    bundle: true,
    entryNames: "frontend-packages.[hash].min",
    entryPoints: ["src/browser/frontendPackagesEntry.ts"],
    format: "esm",
    minify: process.env.NODE_ENV === "production",
    outdir: "public/js",
    platform: "browser",
    plugins: [
      cleanPlugin(
        "public/js",
        /^frontend-packages\.[a-zA-Z0-9]+\.min\.js(\.map)?$/,
      ),
    ],
    sourcemap: process.env.NODE_ENV !== "production",
    target: "esnext",
    treeShaking: false,
  },
];
