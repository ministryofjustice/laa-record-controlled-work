import type { BuildOptions } from "esbuild";

import esbuild from "esbuild";

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;

/**
 * Sets up esbuild watch contexts for all build configs.
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

  console.log("✅ Watch mode started. Watching for file changes...");

  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping watch mode...");
    void Promise.all(
      contexts.map(async (ctx) => {
        await ctx.dispose();
      }),
    )
      .then(() => {
        process.exit(EXIT_SUCCESS);
      })
      .catch((error: unknown) => {
        console.error("❌ Error during cleanup:", error);
        process.exit(EXIT_FAILURE);
      });
  });
}
