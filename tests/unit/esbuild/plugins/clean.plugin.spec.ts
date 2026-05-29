import { strict as assert } from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import esbuild from "esbuild";

import { cleanPlugin } from "../../../../esbuild/plugins/clean.plugin.js";

describe("cleanPlugin", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clean-plugin-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const runWithClean = async (dir: string, pattern: RegExp): Promise<void> => {
    const entry = path.join(tmpDir, "entry.js");
    fs.writeFileSync(entry, "");
    await esbuild.build({
      entryPoints: [entry],
      outdir: path.join(tmpDir, "out"),
      plugins: [cleanPlugin(dir, pattern)],
      write: false,
    });
  };

  it("should remove files matching the pattern", async () => {
    fs.writeFileSync(path.join(tmpDir, "main.ABC12345.css"), "body{}");
    fs.writeFileSync(path.join(tmpDir, "main.DEF67890.css"), "body{}");

    await runWithClean(tmpDir, /^main\.[a-zA-Z0-9]+\.css$/);

    assert.ok(!fs.existsSync(path.join(tmpDir, "main.ABC12345.css")));
    assert.ok(!fs.existsSync(path.join(tmpDir, "main.DEF67890.css")));
  });

  it("should leave non-matching files untouched", async () => {
    fs.writeFileSync(path.join(tmpDir, "main.ABC12345.css"), "body{}");
    fs.writeFileSync(path.join(tmpDir, "keep-me.txt"), "important");
    fs.writeFileSync(path.join(tmpDir, "other.js"), "");

    await runWithClean(tmpDir, /^main\.[a-zA-Z0-9]+\.css$/);

    assert.ok(fs.existsSync(path.join(tmpDir, "keep-me.txt")));
    assert.ok(fs.existsSync(path.join(tmpDir, "other.js")));
  });

  it("should handle a non-existent directory without error", async () => {
    const nonExistent = path.join(tmpDir, "does-not-exist");
    await runWithClean(nonExistent, /.*/);
  });

  it("should remove source map files when pattern includes them", async () => {
    fs.writeFileSync(path.join(tmpDir, "main.ABC12345.css"), "body{}");
    fs.writeFileSync(path.join(tmpDir, "main.ABC12345.css.map"), "{}");

    await runWithClean(tmpDir, /^main\.[a-zA-Z0-9]+\.css(\.map)?$/);

    assert.ok(!fs.existsSync(path.join(tmpDir, "main.ABC12345.css")));
    assert.ok(!fs.existsSync(path.join(tmpDir, "main.ABC12345.css.map")));
  });
});
