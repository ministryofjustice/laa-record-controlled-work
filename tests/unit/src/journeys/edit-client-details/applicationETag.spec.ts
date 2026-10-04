import { expect } from "chai";
import { describe, it } from "mocha";

import {
  parseApplicationETag,
  parseSafeApplicationETag,
} from "#/lib/applicationETag.js";

describe("application ETag validation", () => {
  it("retains valid quoted signed-64-bit versions exactly", () => {
    for (const etag of ['"0"', '"00042"', '"9223372036854775807"']) {
      expect(parseApplicationETag(etag)).to.equal(etag);
    }
  });

  it("rejects missing, weak, wildcard, malformed, non-ASCII, and overflowing validators", () => {
    const invalidValues: unknown[] = [
      undefined,
      null,
      "",
      'W/"1"',
      "*",
      "1",
      '"+1"',
      '"-1"',
      '"1.0"',
      '"١"',
      '"1',
      '1"',
      '"9223372036854775808"',
    ];

    for (const value of invalidValues) {
      expect(() => parseApplicationETag(value)).to.throw();
    }
  });

  it("converts safe numeric versions and retains leading-zero value", () => {
    expect(parseSafeApplicationETag('"0"')).to.equal(0);
    expect(parseSafeApplicationETag('"00042"')).to.equal(42);
    expect(parseSafeApplicationETag('"9007199254740991"')).to.equal(
      Number.MAX_SAFE_INTEGER,
    );
  });

  it("rejects versions that cannot be represented safely as numbers", () => {
    for (const etag of ['"9007199254740992"', '"9223372036854775807"']) {
      expect(() => parseSafeApplicationETag(etag)).to.throw();
    }
  });
});
