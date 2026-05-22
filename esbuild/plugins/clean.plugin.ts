import type { Plugin } from "esbuild";

import fs from "node:fs";
import path from "node:path";

/**
 * Removes files matching a pattern from a directory before each build.
 * @param dir - Directory to clean.
 * @param pattern - Regex to match filenames for removal.
 * @returns An esbuild plugin.
 */
export const cleanPlugin = (dir: string, pattern: RegExp): Plugin => ({
  name: "clean",
  setup(build) {
    build.onStart(() => {
      if (!fs.existsSync(dir)) return;
      for (const file of fs.readdirSync(dir)) {
        if (pattern.test(file)) {
          fs.unlinkSync(path.join(dir, file));
        }
      }
    });
  },
});
