import dotenv from "dotenv";
import esbuild from "esbuild";

import { copyAssets, copyViews } from "./assets.js";
import { appConfig } from "./configs/app.config.js";
import { browserConfigs } from "./configs/browser.config.js";
import { scssConfig } from "./configs/scss.config.js";
import { startWatchers } from "./watcher.js";

dotenv.config();

const isWatch = process.argv.includes("--watch");

const configs = [appConfig(), scssConfig(), ...browserConfigs()];

await copyAssets();
await copyViews();

if (isWatch) {
  await startWatchers(configs);
} else {
  console.log("🚀 Starting build process...");
  await Promise.all(configs.map(async (c) => await esbuild.build(c)));
  console.log("✅ Build completed successfully.");
}
