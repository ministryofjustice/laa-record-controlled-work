import type { BuildOptions } from "esbuild";

import { strict as assert } from "node:assert";

import esbuild from "esbuild";

import { appConfig } from "../../../esbuild/configs/app.config.js";
import { browserConfigs } from "../../../esbuild/configs/browser.config.js";
import { scssConfig } from "../../../esbuild/configs/scss.config.js";

const BUILD_TIMEOUT = 30_000;

const SIDE_EFFECT_PLUGINS = new Set(["clean", "copy"]);

const withoutSideEffects = (config: BuildOptions): BuildOptions => ({
  ...config,
  plugins: config.plugins?.filter((p) => !SIDE_EFFECT_PLUGINS.has(p.name)),
});

describe("esbuild build", function () {
  this.timeout(BUILD_TIMEOUT);

  it("should build the server app to public/app.js", async () => {
    const result = await esbuild.build({
      ...withoutSideEffects(appConfig()),
      metafile: true,
      write: false,
    });

    const outputs = Object.keys(result.metafile.outputs);
    assert.ok(
      outputs.some((p) => p === "public/app.js"),
      `Expected public/app.js in outputs: ${outputs.join(", ")}`,
    );
  });

  it("should build SCSS with a content-hashed filename", async () => {
    const result = await esbuild.build({
      ...withoutSideEffects(scssConfig()),
      metafile: true,
      write: false,
    });

    const outputs = Object.keys(result.metafile.outputs);
    assert.ok(
      outputs.some((p) => /^public\/css\/main\.[A-Z0-9]+\.css$/.test(p)),
      `Expected public/css/main.[hash].css in outputs: ${outputs.join(", ")}`,
    );
  });

  it("should build frontend-packages.js with a content-hashed filename", async () => {
    const [frontendConfig] = browserConfigs();
    const result = await esbuild.build({
      ...withoutSideEffects(frontendConfig),
      metafile: true,
      write: false,
    });

    const outputs = Object.keys(result.metafile.outputs);
    assert.ok(
      outputs.some((p) =>
        /^public\/js\/frontend-packages\.[A-Z0-9]+\.min\.js$/.test(p),
      ),
      `Expected public/js/frontend-packages.[hash].min.js in outputs: ${outputs.join(", ")}`,
    );
  });

  it("should include source maps in non-production mode", async () => {
    const result = await esbuild.build({
      ...withoutSideEffects(scssConfig()),
      metafile: true,
      write: false,
    });

    const outputs = Object.keys(result.metafile.outputs);
    assert.ok(
      outputs.some((p) => /\.css\.map$/.test(p)),
      `Expected .css.map source map in outputs: ${outputs.join(", ")}`,
    );
  });
});
