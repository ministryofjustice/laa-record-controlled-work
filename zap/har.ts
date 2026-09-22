import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface Har {
  log: {
    entries: HarEntry[];
  };
}

interface HarEntry {
  request: { url: string };
  response: { status: number };
}

const ABORTED_REQUEST_STATUS = 0;
const EMPTY_HAR_COUNT = 0;

export const createHarPath = (directory: string, identifier: string): string =>
  join(directory, `${identifier.replaceAll(/[^a-zA-Z0-9-]/g, "-")}.har`);

export const mergeHarFiles = async (
  harPaths: string[],
  outputPath: string,
): Promise<void> => {
  const hars = await Promise.all(
    harPaths.map(async (harPath) => {
      const parsedHar: unknown = JSON.parse(await readFile(harPath, "utf-8"));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- files are produced by Playwright's recordHar
      return parsedHar as Har;
    }),
  );

  if (hars.length === EMPTY_HAR_COUNT) {
    throw new Error("No HAR files were produced by the e2e test suite.");
  }

  const [firstHar] = hars;

  const entries = hars
    .flatMap((har) => har.log.entries)
    .filter((entry) => entry.response.status > ABORTED_REQUEST_STATUS);

  await writeFile(
    outputPath,
    JSON.stringify({
      ...firstHar,
      log: { ...firstHar.log, entries },
    }),
  );
};
