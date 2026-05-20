import type { BuildOptions } from "esbuild";

import chokidar from "chokidar";
import esbuild from "esbuild";

import { copyAssets, copyViews } from "./assets.js";

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;

/**
 * Sets up esbuild watch contexts and chokidar file watchers for all build configs.
 * @param configs - esbuild build options to watch.
 */
export async function startWatchers(configs: BuildOptions[]): Promise<void> {
  const contexts = await Promise.all(
    configs.map(async (config) => {
      const ctx = await esbuild.context(config);
      await ctx.watch();
      return ctx;
    }),
  );

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

  const viewsWatcher = chokidar.watch(["src/views/**/*"], {
    persistent: true,
  });

  assetWatcher.on("change", () => {
    copyAssets().catch((error: unknown) => {
      console.error("❌ Failed to copy assets:", error);
    });
  });

  viewsWatcher.on("change", () => {
    copyViews().catch((error: unknown) => {
      console.error("❌ Failed to copy views:", error);
    });
  });

  console.log("✅ Watch mode started. Watching for file changes...");

  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping watch mode...");
    void Promise.all(
      contexts.map(async (ctx) => {
        await ctx.dispose();
      }),
    )
      .then(() => {
        void assetWatcher.close();
        process.exit(EXIT_SUCCESS);
      })
      .catch((error: unknown) => {
        console.error("❌ Error during cleanup:", error);
        process.exit(EXIT_FAILURE);
      });
  });
}
