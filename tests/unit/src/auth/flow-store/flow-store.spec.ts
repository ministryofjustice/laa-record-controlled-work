import { expect } from "chai";
import sinon from "sinon";

import { createAuthFlowStore } from "#/auth/auth.flow-store.js";
import config from "#/config.js";
import { SESSION_ID } from "#tests/unit/src/auth/flow-store/fixtures.js";

describe("Auth flow store configuration", () => {
  afterEach(() => {
    sinon.restore();
  });

  for (const environment of ["development", "docker", "test"]) {
    it(`allows memory storage in ${environment}`, async () => {
      sinon.stub(config.redis, "enabled").value(false);
      sinon.stub(config.app, "environment").value(environment);

      const result = await createAuthFlowStore().reserve(SESSION_ID);

      expect(result.error).to.be.undefined;
    });
  }

  for (const environment of ["uat", "staging", "production", "unknown"]) {
    it(`requires Redis when disabled in ${environment}`, () => {
      sinon.stub(config.redis, "enabled").value(false);
      sinon.stub(config.app, "environment").value(environment);

      expect(() => createAuthFlowStore()).to.throw(
        "Redis is required for authentication flow storage",
      );
    });
  }
});