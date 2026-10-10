import { expect } from "chai";
import { describe, it } from "mocha";

import {
  applicationETagToNumber,
  validateApplicationETag,
} from "#/journeys/edit-application/applicationETag.js";

describe("application ETag validation", () => {
  it("retains valid quoted decimal ETags exactly", () => {
    for (const etag of ['"0"', '"000"', '"9223372036854775807"']) {
      expect(validateApplicationETag(etag)).to.equal(etag);
    }
  });

  it("rejects missing, weak, wildcard, malformed, non-ASCII, and out-of-range ETags", () => {
    const invalidETags = [
      undefined,
      null,
      "",
      'W/"1"',
      "*",
      "1",
      '"+1"',
      '"-1"',
      '"1.0"',
      '"１２"',
      '"9223372036854775808"',
      '"1',
      '1"',
      '"1"\n',
    ];

    for (const etag of invalidETags) {
      expect(() => validateApplicationETag(etag)).to.throw();
    }
  });

  it("converts safe versions without losing precision", () => {
    expect(applicationETagToNumber('"0"')).to.equal(0);
    expect(applicationETagToNumber('"0007"')).to.equal(7);
    expect(applicationETagToNumber('"9007199254740991"')).to.equal(
      Number.MAX_SAFE_INTEGER,
    );
  });

  it("rejects valid API versions that cannot be represented safely as numbers", () => {
    expect(() => applicationETagToNumber('"9007199254740992"')).to.throw();
    expect(() => applicationETagToNumber('"9223372036854775807"')).to.throw();
  });
});
