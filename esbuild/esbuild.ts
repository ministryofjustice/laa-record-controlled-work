import type esbuild from "esbuild";

import chokidar from "chokidar";
import dotenv from "dotenv";

import { buildAppJs } from "./app.config.js";
import { buildCustomJs, buildFrontendPackages } from "./browser.config.js";
import {
  NO_MORE_ASYNC_OPERATIONS,
  SECOND_IN_ARRAY,
  UNCAUGHT_FATAL_EXCEPTION,
} from "./constants.js";
import { copyAssets, copyViews } from "./copy-assets.js";
import { buildScss } from "./scss.config.js";

// Load environment variables
dotenv.config();

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
