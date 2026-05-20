import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import path from "node:path";

import {
  buildNumber,
  type SassPluginOptions,
  UNCAUGHT_FATAL_EXCEPTION,
} from "./constants.js";

/**
 * Builds SCSS files with optional watch capability.
 * @async
 * @param {boolean} watch - Whether to enable watch mode
 * @returns {Promise<esbuild.BuildContext | undefined>} Build context if watching, undefined otherwise
 */
export const buildScss = async (
  watch = false,
): Promise<esbuild.BuildContext | undefined> => {
  const options: esbuild.BuildOptions = {
    bundle: true,
    entryPoints: ["src/scss/main.scss"],
    external: [
      "*.woff",
      "*.woff2",
      "*.svg",
      "*.png",
      "*.jpg",
      "*.jpeg",
      "*.gif",
    ],
    loader: {
      ".css": "css",
      ".scss": "css",
    },
    minify: process.env.NODE_ENV === "production",
    outfile: `public/css/main.${buildNumber}.css`,
    plugins: [
      sassPlugin({
        loadPaths: [
          path.resolve("."), // Current directory
          path.resolve("node_modules"), // Node modules directory
        ],
        /**
         * Transforms SCSS content to update asset paths.
         * @param {string} source - Original SCSS source content.
         * @returns {string} Transformed SCSS with updated asset paths.
         */
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
      } satisfies SassPluginOptions),
    ],
    sourcemap: process.env.NODE_ENV !== "production",
  };

  if (watch) {
    const context = await esbuild.context(options);
    await context.watch();
    return context;
  } else {
    await esbuild.build(options).catch((error: unknown) => {
      console.error("❌ SCSS build failed:", error);
      process.exit(UNCAUGHT_FATAL_EXCEPTION);
    });
    return undefined;
  }
};
