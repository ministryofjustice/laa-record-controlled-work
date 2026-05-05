import type { Application } from "express";
import nunjucks from "nunjucks";
import { nunjucksT } from "#/lib/i18nLoader.js";
import fs from "node:fs";
import path from "node:path";

const FIRST_IN_ARRAY = 0;

/**
 * Get the latest build file from the specified directory.
 * @param {string} directory - The directory to search in.
 * @param {string} prefix - The prefix of the build files.
 * @param {string} extension - The extension of the build files.
 * @returns {string} - The name of the latest build file or an empty string if none found.
 */
export const resolveAsset = (
  directory: string,
  prefix: string,
  extension: string,
): string => {
  const files = fs.readdirSync(directory);
  const pattern = new RegExp(`^${prefix}\\.\\d+\\.${extension}$`);
  const matchingFiles = files.filter((file) => pattern.test(file));
  return matchingFiles.length > FIRST_IN_ARRAY
    ? matchingFiles[FIRST_IN_ARRAY]
    : "";
};

/**
 * Sets up Nunjucks as the template engine for the given Express application.
 * This function configures the view engine, sets the asset path, and specifies
 * the directories where Nunjucks should look for template files.
 *
 * @param {Application} app - The Express application instance.
 * @returns {void} This function does not return a value; it configures Nunjucks for the provided app.
 */
export const setupNunjucks = (app: Application): nunjucks.Environment => {
  const appInstance = app;
  appInstance.set("view engine", "njk");

  // Set asset path in locals
  const locals = appInstance.locals as Record<string, unknown>;
  locals.asset_path = "/assets/";

  /**
   * Retrieves the latest build file for the given prefix and extension.
   *
   * @param {string} prefix - The prefix of the asset file.
   * @param {string} ext - The extension of the asset file (e.g., 'js' or 'css').
   * @returns {string} The path to the latest build file.
   */
  locals.getAsset = (prefix: string, ext: string): string => {
    const directory =
      ext === "js" || ext === "min.js" ? "public/js" : "public/css";
    return resolveAsset(directory, prefix, ext);
  };

  // Tell Nunjucks where to look for njk files
  const nunjucksEnv = nunjucks.configure(
    [
      path.join(process.cwd(), "src", "views"), // Main views directory
      "node_modules/govuk-frontend/dist", // GOV.UK Frontend templates
      "node_modules/govuk-frontend/dist/components/", // GOV.UK components
      "node_modules/@ministryofjustice/frontend", // MoJ Design System components
      "node_modules/@ministryofjustice/hmpps-forge/dist/govuk-components/",
      "node_modules/@ministryofjustice/hmpps-forge/dist/moj-components/",
    ],
    {
      autoescape: true, // Enable auto escaping to prevent XSS attacks
      express: appInstance, // Bind Nunjucks to the Express app instance
      watch: process.env.NODE_ENV === "development", // Watch for template changes in development only
    },
  );

  // Add global variables
  nunjucksEnv.addGlobal("t", nunjucksT);

  return nunjucksEnv;
};
