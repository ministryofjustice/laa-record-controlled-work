import { readdir } from "node:fs/promises";
import { join } from "node:path";

import { mergeHarFiles } from "#zap/har.js";

const MERGE_HAR_ARGUMENT_COUNT = 2;
const commandArguments = process.argv.slice(MERGE_HAR_ARGUMENT_COUNT);

if (commandArguments.length !== MERGE_HAR_ARGUMENT_COUNT) {
  throw new Error("Usage: merge-hars <har-directory> <output-path>");
}

const [harDirectory, outputPath] = commandArguments;

const harPaths = (await readdir(harDirectory))
  .filter((fileName) => fileName.endsWith(".har"))
  .sort()
  .map((fileName) => join(harDirectory, fileName));

await mergeHarFiles(harPaths, outputPath);
