import "dotenv/config";
import { defineConfig } from "orval";

import { createPdaConfig } from "./orval/pda.orval.js";
import { rcwConfig } from "./orval/rcw.orval.js";

const buildConfig = (): ReturnType<typeof defineConfig> => {
  const config = { rcwConfig };
  if (process.env.CI !== "true") {
    Object.assign(config, { pdaConfig: createPdaConfig() });
  }
  return config;
};

export default defineConfig(buildConfig());
