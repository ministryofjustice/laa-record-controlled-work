/**
 * @file Displays an ASCII Art banner on application startup.
 * Uses `figlet` for ASCII rendering.
 */

import figlet from "figlet";

import type { Config } from "#/config.types.js";

import { logger } from "#/logger.js";

/**
 * Displays an ASCII Art banner with department name in the console.
 * @param {import('#/config.types.js').Config} config - The application config object
 * @returns {void}
 */
const displayAsciiBanner = (config: Config): void => {
  try {
    const data = figlet.textSync(config.app.service.name);
    if (data === "") {
      logger.error("No ASCII art data generated", undefined);
      return;
    }
    process.stdout.write("\x1Bc");
    logger.info(data);
    logger.info("Server is running at:");
    logger.info(`http://localhost:${config.app.port}`);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : JSON.stringify(err);
    logger.error("Error generating ASCII art", errorMessage);
  }
};

// Export the function for use in other files
export { displayAsciiBanner };
