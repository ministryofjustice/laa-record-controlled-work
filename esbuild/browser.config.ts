import esbuild from "esbuild";

import { buildNumber, UNCAUGHT_FATAL_EXCEPTION } from "./constants.js";

/**
 * Builds `custom.js` with optional watch capability.
 * @async
 * @param {boolean} watch - Whether to enable watch mode
 * @returns {Promise<esbuild.BuildContext | undefined>} Build context if watching, undefined otherwise
 */
export const buildCustomJs = async (
  watch = false,
): Promise<esbuild.BuildContext | undefined> => {
  const options: esbuild.BuildOptions = {
    bundle: true,
    entryPoints: ["src/browser/custom.ts"],
    format: "esm",
    minify: process.env.NODE_ENV === "production",
    outfile: `public/js/custom.${buildNumber}.min.js`,
    platform: "browser",
    sourcemap: process.env.NODE_ENV !== "production",
    target: "esnext",
  };

  if (watch) {
    const context = await esbuild.context(options);
    await context.watch();
    return context;
  } else {
    await esbuild.build(options).catch((error: unknown) => {
      console.error("❌ custom.js build failed:", error);
      process.exit(UNCAUGHT_FATAL_EXCEPTION);
    });
    return undefined;
  }
};

/**
 * Build GOV.UK frontend & MOJ frontend files separately with optional watch capability.
 * @async
 * @param {boolean} watch - Whether to enable watch mode
 * @returns {Promise<esbuild.BuildContext | undefined>} Build context if watching, undefined otherwise
 */
export const buildFrontendPackages = async (
  watch = false,
): Promise<esbuild.BuildContext | undefined> => {
  const options: esbuild.BuildOptions = {
    bundle: true,
    entryPoints: ["src/browser/frontendPackagesEntry.ts"],
    format: "esm",
    minify: process.env.NODE_ENV === "production",
    outfile: `public/js/frontend-packages.${buildNumber}.min.js`,
    platform: "browser",
    sourcemap: process.env.NODE_ENV !== "production",
    target: "esnext",
    treeShaking: false, // Disable tree shaking to preserve side-effect imports
  };

  if (watch) {
    const context = await esbuild.context(options);
    await context.watch();
    return context;
  } else {
    await esbuild.build(options).catch((error: unknown) => {
      console.error(
        "❌ GOV.UK frontend and/or MOJ frontend JS build failed:",
        error,
      );
      process.exit(UNCAUGHT_FATAL_EXCEPTION);
    });
    return undefined;
  }
};
