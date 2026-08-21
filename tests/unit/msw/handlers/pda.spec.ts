import { expect } from "chai";

import { readLaaAccountsHeader } from "#msw/handlers/pda.js";
import { PDA_MSW_LAA_ACCOUNTS_HEADER } from "#/lib/constants/pda.js";

describe("readLaaAccountsHeader", () => {
  it("returns the office codes from the header", () => {
    const request = new Request("https://pda.test/provider-firms/1/provider-offices", {
      headers: { [PDA_MSW_LAA_ACCOUNTS_HEADER]: JSON.stringify(["0R128U", "0R695K"]) },
    });

    expect(readLaaAccountsHeader(request)).to.deep.equal(["0R128U", "0R695K"]);
  });

  it("returns undefined when the header is absent", () => {
    const request = new Request("https://pda.test/provider-firms/1/provider-offices");

    expect(readLaaAccountsHeader(request)).to.equal(undefined);
  });

  it("returns undefined when the header is not valid JSON", () => {
    const request = new Request("https://pda.test/provider-firms/1/provider-offices", {
      headers: { [PDA_MSW_LAA_ACCOUNTS_HEADER]: "not-json" },
    });

    expect(readLaaAccountsHeader(request)).to.equal(undefined);
  });
});
