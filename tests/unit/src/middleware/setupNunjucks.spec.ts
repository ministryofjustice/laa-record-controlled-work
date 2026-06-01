import { resolveAsset } from "#/middleware/setupNunjucks.js";
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
        "main.A1b2C3d4.js",
        "main.E5f6G7h8.js",
        "notmain.X9y0Z1a2.js",
        "main.css",
      ]);

      const result = resolveAsset("public/js", "main", "js");
      assert.equal(result, "main.A1b2C3d4.js");
    });

    it("should return an empty string if no matches found", () => {
      readdirStub.returns(["other.A1b2C3d4.js", "file.css", "main.js"]);

      const result = resolveAsset("public/js", "main", "js");
      assert.equal(result, "");
    });

    it("should match based on dynamic prefix and extension", () => {
      readdirStub.returns(["style.B2c3D4e5.css", "style.F6g7H8i9.css", "main.J0k1L2m3.js"]);
      const result = resolveAsset("public/css", "style", "css");
      assert.equal(result, "style.B2c3D4e5.css");
    });
  });
});
