import dotenv from "dotenv";
import esbuild from "esbuild";

import { appConfig } from "./configs/app.config.js";
import { assetsConfig } from "./configs/assets.config.js";
import { browserConfigs } from "./configs/browser.config.js";
import { scssConfig } from "./configs/scss.config.js";
import { startWatchers } from "./watcher.js";

dotenv.config();

const watch = process.argv.includes("--watch");

const configs = [
  appConfig(watch),
  assetsConfig(watch),
  scssConfig(),
  ...browserConfigs(),
];

if (watch) {
  await startWatchers(configs);
} else {
  console.log("🚀 Starting build process...");
  await Promise.all(configs.map(async (c) => await esbuild.build(c)));
  console.log("✅ Build completed successfully.");
}
