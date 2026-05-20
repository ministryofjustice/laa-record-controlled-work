import fs from "fs-extra";
import path from "node:path";

/** Copies GOV.UK and MOJ Frontend assets to the public directory. */
export async function copyAssets(): Promise<void> {
  await fs.copy(
    path.resolve("./node_modules/govuk-frontend/dist/govuk/assets"),
    path.resolve("./public/assets"),
  );
  await fs.copy(
    path.resolve(
      "./node_modules/@ministryofjustice/frontend/moj/assets/images",
    ),
    path.resolve("./public/assets/images"),
  );
  console.log("✅ GOV.UK & MOJ Frontend assets copied.");
}

/** Copies Nunjucks views to the public directory. */
export async function copyViews(): Promise<void> {
  await fs.copy(path.resolve("./src/views"), path.resolve("./public/views"));
  console.log("✅ Nunjucks views copied.");
}
