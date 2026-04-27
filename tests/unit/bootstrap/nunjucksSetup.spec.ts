import { resolveAsset } from "#/bootstrap/nunjucksSetup.js";
import { strict as assert } from "node:assert";
import fs from "node:fs";
import sinon from "sinon";

describe("nunjucksSetup", () => {
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
