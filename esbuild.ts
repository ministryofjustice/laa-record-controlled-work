import chokidar from "chokidar";
import dotenv from "dotenv";
import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import fs from "fs-extra";
import { builtinModules } from "node:module";
import path from "node:path";

// Load environment variables
dotenv.config();
const NO_MORE_ASYNC_OPERATIONS = 0;
const UNCAUGHT_FATAL_EXCEPTION = 1;
const SECOND_IN_ARRAY = 1;
const RANDOM_NUMBER_UPPER_BOUND = 10000;

const buildNumber = Math.floor(
  Math.random() * RANDOM_NUMBER_UPPER_BOUND,
).toString();

export interface SassPluginOptions {
  loadPaths?: string[];
  resolveDir?: string;
  transform?: (source: string) => string;
  // Add other possible options
}

/**
 * Copies GOV.UK (fonts and images from `govuk-frontend`), MOJ Frontend (images from `@ministryofjustice/frontend`) and other assets
 * to the `public/assets` directory.
 * @async
 * @returns {Promise<void>} Resolves when the assets are copied successfully.
 */
const copyAssets = async (): Promise<void> => {
  try {
    // GOV.UK assets
    await fs.copy(
      path.resolve("./node_modules/govuk-frontend/dist/govuk/assets"),
      path.resolve("./public/assets"),
    );
    // Copy MOJ Frontend assets
    await fs.copy(
      path.resolve(
        "./node_modules/@ministryofjustice/frontend/moj/assets/images",
      ),
      path.resolve("./public/assets/images"),
    );
    console.log("✅ GOV.UK assets & MOJ Frontend assets copied successfully.");
  } catch (error) {
    console.error("❌ Failed to copy assets:", error);
    process.exit(UNCAUGHT_FATAL_EXCEPTION);
  }
};

const copyViews = async (): Promise<void> => {
  try {
    await fs.copy(path.resolve("./src/views"), path.resolve("./public/views"));
    console.log("✅ Nunjucks views copied successfully.");
  } catch (error) {
    console.error("❌ Failed to copy views:", error);
    process.exit(UNCAUGHT_FATAL_EXCEPTION);
  }
};

/**
 * List of external dependencies that should not be bundled.
 * @constant {string[]}
 */
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

/**
 * Builds SCSS files with optional watch capability.
 * @async
 * @param {boolean} watch - Whether to enable watch mode
 * @returns {Promise<esbuild.BuildContext | undefined>} Build context if watching, undefined otherwise
 */
const buildScss = async (
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

/**
 * Builds `app.js` with optional watch capability.
 * @async
 * @param {boolean} watch - Whether to enable watch mode
 * @returns {Promise<esbuild.BuildContext | undefined>} Build context if watching, undefined otherwise
 */
const buildAppJs = async (
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

/**
 * Builds `custom.js` with optional watch capability.
 * @async
 * @param {boolean} watch - Whether to enable watch mode
 * @returns {Promise<esbuild.BuildContext | undefined>} Build context if watching, undefined otherwise
 */
const buildCustomJs = async (
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
const buildFrontendPackages = async (
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

/**
 * Main watch process that sets up watchers for all build tasks.
 * @async
 * @returns {Promise<void>} Resolves when all watchers are set up.
 */
const watchBuild = async (): Promise<void> => {
  try {
    // Copy assets initially
    await copyAssets();
    await copyViews();

    // Start all watchers
    const contexts = await Promise.all([
      buildScss(true),
      buildAppJs(true),
      buildCustomJs(true),
      buildFrontendPackages(true),
    ]);

    // Watch for asset changes and copy them
    const assetWatcher = chokidar.watch(
      [
        "node_modules/govuk-frontend/dist/govuk/assets/**/*",
        "node_modules/@ministryofjustice/frontend/moj/assets/images/**/*",
      ],
      {
        ignored: /node_modules\/(?!govuk-frontend|@ministryofjustice)/,
        persistent: true,
      },
    );

    const viewsWatcher = chokidar.watch(["/src/views/**/*"], {
      persistent: true,
    });

    /**
     * Handles asset file changes by copying assets.
     * @returns {void}
     */
    const handleAssetChange = (): void => {
      copyAssets().catch((error: unknown) => {
        console.error("❌ Failed to copy assets on change:", error);
      });
    };

    const handleViewsChange = (): void => {
      copyViews().catch((error: unknown) => {
        console.error("❌ Failed to copy views on change:", error);
      });
    };

    assetWatcher.on("change", handleAssetChange);
    viewsWatcher.on("change", handleViewsChange);

    console.log(
      "✅ Watch mode started successfully. Watching for file changes...",
    );

    // Keep the process alive
    /**
     * Handles SIGINT signal for graceful shutdown.
     * @returns {void}
     */
    const handleSigint = (): void => {
      console.log("\n🛑 Stopping watch mode...");
      void Promise.all(
        contexts
          .filter(
            (context): context is esbuild.BuildContext => context !== undefined,
          )
          .map(async (context) => {
            await context.dispose();
          }),
      )
        .then(() => {
          void assetWatcher.close();
          process.exit(NO_MORE_ASYNC_OPERATIONS);
        })
        .catch((error: unknown) => {
          console.error("❌ Error during cleanup:", error);
          process.exit(UNCAUGHT_FATAL_EXCEPTION);
        });
    };

    process.on("SIGINT", handleSigint);
  } catch (error: unknown) {
    console.error("❌ Watch mode setup failed:", error);
    process.exit(UNCAUGHT_FATAL_EXCEPTION);
  }
};

/**
 * Single build process (non-watch mode).
 * @async
 * @returns {Promise<void>} Resolves when the entire build process is completed successfully.
 */
const build = async (): Promise<void> => {
  try {
    console.log("🚀 Starting build process...");

    // Copy assets
    await copyAssets();
    await copyViews();

    // Build all files
    await Promise.all([
      buildScss(false),
      buildAppJs(false),
      buildCustomJs(false),
      buildFrontendPackages(false),
    ]);

    console.log("✅ Build completed successfully.");
  } catch (error: unknown) {
    console.error("❌ Build process failed:", error);
    process.exit(UNCAUGHT_FATAL_EXCEPTION);
  }
};

// Export functions
export { build, watchBuild };

// Run based on command line arguments
if (import.meta.url === `file://${process.argv[SECOND_IN_ARRAY]}`) {
  const isWatch = process.argv.includes("--watch");

  if (isWatch) {
    watchBuild().catch((error: unknown) => {
      console.error("❌ Watch mode failed:", error);
      process.exit(UNCAUGHT_FATAL_EXCEPTION);
    });
  } else {
    build().catch((error: unknown) => {
      console.error("❌ Build script failed:", error);
      process.exit(UNCAUGHT_FATAL_EXCEPTION);
    });
  }
}
