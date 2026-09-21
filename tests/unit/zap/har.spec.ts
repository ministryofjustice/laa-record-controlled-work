import {
  createHarPath,
  mergeHarFiles,
  type Har,
} from "#zap/har.js";
import { expect } from "chai";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const createHar = (entries: unknown[]): string =>
  JSON.stringify({
    log: {
      creator: { name: "Playwright", version: "1.0" },
      entries,
      version: "1.2",
    },
  });

describe("ZAP HAR files", () => {
  it("creates a distinct HAR path for each test", () => {
    expect(createHarPath("zap-results/hars", "first test")).to.equal(
      "zap-results/hars/first-test.har",
    );
    expect(createHarPath("zap-results/hars", "second test")).to.equal(
      "zap-results/hars/second-test.har",
    );
  });

  it("merges valid entries from every HAR and excludes aborted requests", async () => {
    const directory = await mkdtemp(join(tmpdir(), "zap-har-"));
    const firstHarPath = join(directory, "first.har");
    const secondHarPath = join(directory, "second.har");
    const mergedHarPath = join(directory, "combined.har");

    await writeFile(
      firstHarPath,
      createHar([
        { request: { url: "http://localhost:8080/" }, response: { status: 200 } },
        { request: { url: "http://localhost:8080/app.css" }, response: { status: 0 } },
      ]),
    );
    await writeFile(
      secondHarPath,
      createHar([
        { request: { url: "http://localhost:8080/cases" }, response: { status: 200 } },
      ]),
    );

    await mergeHarFiles([firstHarPath, secondHarPath], mergedHarPath);

    const mergedHar = JSON.parse(
      await readFile(mergedHarPath, "utf-8"),
    ) as Har;

    expect(mergedHar.log.entries.map((entry) => entry.request.url)).to.deep.equal([
      "http://localhost:8080/",
      "http://localhost:8080/cases",
    ]);
  });
});