/**
 *
 * @description Tests that a random number is created, that can be applied to file assets etc
 */

import {
  generateBuildNumber,
  resolveAsset,
} from "#src/bootstrap/assetFingerprint.js";
import { strict as assert } from "node:assert";
import fs from "node:fs";
import sinon from "sinon";

describe("assetFingerprint", () => {
  describe("generateBuildNumber", () => {
    const MIN_BUILD_NUMBER = 0;
    const MAX_BUILD_NUMBER = 9999;

    it("should return a string of digits", () => {
      const result = generateBuildNumber();
      assert(/^\d+$/.test(result), "Should be a string of digits");
    });

    it("should return a number less than 10000", () => {
      const num = parseInt(generateBuildNumber(), 10);
      assert(
        num >= MIN_BUILD_NUMBER && num <= MAX_BUILD_NUMBER,
        "Should be between 0 and 9999",
      );
    });
  });

  describe("resolveAsset", () => {
    let readdirStub: sinon.SinonStub = sinon.stub();

    beforeEach(() => {
      readdirStub = sinon.stub(fs, "readdirSync");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should return the first matching file", () => {
      readdirStub.returns([
        "main.123.js",
        "main.456.js",
        "notmain.789.js",
        "main.css",
      ]);

      const result = resolveAsset("public/js", "main", "js");
      assert.equal(result, "main.123.js");
    });

    it("should return an empty string if no matches found", () => {
      readdirStub.returns(["other.123.js", "file.css", "main.js"]);

      const result = resolveAsset("public/js", "main", "js");
      assert.equal(result, "");
    });

    it("should match based on dynamic prefix and extension", () => {
      readdirStub.returns(["style.987.css", "style.999.css", "main.001.js"]);
      const result = resolveAsset("public/css", "style", "css");
      assert.equal(result, "style.987.css");
    });
  });
});
