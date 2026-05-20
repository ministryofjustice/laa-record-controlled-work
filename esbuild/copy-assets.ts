import fs from "fs-extra";
import path from "node:path";

import { UNCAUGHT_FATAL_EXCEPTION } from "./constants.js";

/**
 * Copies GOV.UK (fonts and images from `govuk-frontend`), MOJ Frontend (images from `@ministryofjustice/frontend`) and other assets
 * to the `public/assets` directory.
 * @async
 * @returns {Promise<void>} Resolves when the assets are copied successfully.
 */
export const copyAssets = async (): Promise<void> => {
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

export const copyViews = async (): Promise<void> => {
  try {
    await fs.copy(path.resolve("./src/views"), path.resolve("./public/views"));
    console.log("✅ Nunjucks views copied successfully.");
  } catch (error) {
    console.error("❌ Failed to copy views:", error);
    process.exit(UNCAUGHT_FATAL_EXCEPTION);
  }
};
