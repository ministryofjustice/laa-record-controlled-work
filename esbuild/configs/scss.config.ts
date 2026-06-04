import type { BuildOptions } from "esbuild";

import { sassPlugin } from "esbuild-sass-plugin";
import path from "node:path";

import { cleanPlugin } from "../plugins/clean.plugin.js";

export const scssConfig = (): BuildOptions => ({
  bundle: true,
  entryNames: "[name].[hash]",
  entryPoints: ["src/scss/main.scss"],
  external: ["*.woff", "*.woff2", "*.svg", "*.png", "*.jpg", "*.jpeg", "*.gif"],
  loader: { ".css": "css", ".scss": "css" },
  minify: process.env.NODE_ENV === "production",
  outdir: "public/css",
  plugins: [
    sassPlugin({
      loadPaths: [path.resolve("."), path.resolve("node_modules")],
      // silence warnings from sass regarding govuk-frontend depreciations when running tests, as they are too noisy
      ...(process.env.NODE_ENV === "test" && {
        logger: {
          debug: () => {
            /* empty */
          },
          warn: () => {
            /* empty */
          },
        },
        quietDeps: true,
        silenceDeprecations: ["import"],
      }),
      transform: (source: string): string =>
        source
          .replace(
            /url\(["']?\/assets\/fonts\/([^"')]+)["']?\)/g,
            'url("/assets/fonts/$1")',
          )
          .replace(
            /url\(["']?\/assets\/images\/([^"')]+)["']?\)/g,
            'url("/assets/images/$1")',
          ),
    }),
    cleanPlugin("public/css", /^main\.[a-zA-Z0-9]+\.css(\.map)?$/),
  ],
  sourcemap: process.env.NODE_ENV !== "production",
});
