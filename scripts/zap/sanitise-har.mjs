import { readFile, writeFile } from "node:fs/promises";

const [harPath] = process.argv.slice(2);

if (harPath === undefined) {
  throw new Error("Expected the path to a HAR file.");
}

const har = JSON.parse(await readFile(harPath, "utf8"));
const entries = har.log.entries;

har.log.entries = entries.filter(
  (entry) =>
    Number.isInteger(entry.response?.status) &&
    entry.response.status >= 100 &&
    entry.response.status <= 599,
);

await writeFile(harPath, `${JSON.stringify(har)}\n`);
