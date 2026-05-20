import esbuild from "esbuild";

import { externalModules, UNCAUGHT_FATAL_EXCEPTION } from "./constants.js";

/**
 * Builds `app.js` with optional watch capability.
 * @async
 * @param {boolean} watch - Whether to enable watch mode
 * @returns {Promise<esbuild.BuildContext | undefined>} Build context if watching, undefined otherwise
 */
export const buildAppJs = async (
  watch = false,
): Promise<esbuild.BuildContext | undefined> => {
  const options: esbuild.BuildOptions = {
    bundle: true,
    entryPoints: ["src/server.ts"],
    external: externalModules,
    format: "esm",
    loader: {
      ".js": "jsx",
      ".json": "json",
      ".ts": "tsx",
    },
    minify: process.env.NODE_ENV === "production",
    outfile: "public/app.js",
    platform: "node",
    sourcemap: process.env.NODE_ENV !== "production",
    target: "esnext",
  };

  if (watch) {
    const context = await esbuild.context(options);
    await context.watch();
    return context;
  } else {
    await esbuild.build(options).catch((error: unknown) => {
      console.error("❌ app.js build failed:", error);
      process.exit(UNCAUGHT_FATAL_EXCEPTION);
    });
    return undefined;
  }
};
