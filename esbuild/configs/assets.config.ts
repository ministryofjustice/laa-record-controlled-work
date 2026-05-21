import type { BuildOptions } from "esbuild";

import { copy } from "esbuild-plugin-copy";

/**
 * Copies GOV.UK and MOJ Frontend assets into the public directory.
 * @param watch - Whether to watch source files for changes.
 * @returns esbuild BuildOptions with the copy plugin configured.
 */
export const assetsConfig = (watch = false): BuildOptions => ({
  outdir: "public/assets",
  plugins: [
    copy({
      assets: [
        {
          from: "node_modules/govuk-frontend/dist/govuk/assets/**/*",
          to: "public/assets",
          watch,
        },
        {
          from: "node_modules/@ministryofjustice/frontend/moj/assets/images/**/*",
          to: "public/assets/images",
          watch,
        },
      ],
      resolveFrom: "cwd",
    }),
  ],
});
