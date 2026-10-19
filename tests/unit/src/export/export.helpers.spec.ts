import { expect } from "chai";
import { describe, it } from "mocha";

import { escapeHtml } from "#/export/export.helpers.js";

describe("escapeHtml", () => {
  it("escapes markup, ampersands and both quote characters", () => {
    expect(escapeHtml("<span title=\"saved\">'value' & text</span>")).to.equal(
      "&lt;span title=&quot;saved&quot;&gt;&#39;value&#39; &amp; text&lt;/span&gt;",
    );
  });

  it("escapes every occurrence of special characters", () => {
    expect(escapeHtml("&<&<>>\"\"''")).to.equal(
      "&amp;&lt;&amp;&lt;&gt;&gt;&quot;&quot;&#39;&#39;",
    );
  });

  it("preserves ordinary text and whitespace", () => {
    expect(escapeHtml("Saved text \n\t123")).to.equal("Saved text \n\t123");
  });

  it("preserves empty input", () => {
    expect(escapeHtml("")).to.equal("");
  });

  it("treats existing HTML entities as plain text", () => {
    expect(escapeHtml("&lt;script&gt;")).to.equal("&amp;lt;script&amp;gt;");
  });
});
