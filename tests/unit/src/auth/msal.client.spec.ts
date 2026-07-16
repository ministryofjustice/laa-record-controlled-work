import {
  ConfidentialClientApplication,
  type ICachePlugin,
} from "@azure/msal-node";
import { expect } from "chai";
import sinon from "sinon";

import { createMsalClient } from "#/auth/msal.client.js";

describe("createMsalClient", () => {
  afterEach(() => sinon.restore());

  it("returns a ConfidentialClientApplication", () => {
    const client = createMsalClient();

    expect(client).to.be.an.instanceOf(ConfidentialClientApplication);
  });

  it("uses cachePlugin as token cache persistence", () => {
    const msalCachePlugin = {
      beforeCacheAccess: sinon.stub().resolves(),
      afterCacheAccess: sinon.stub().resolves(),
    } as unknown as ICachePlugin;

    const client = createMsalClient({ msalCachePlugin });

    expect(client.getTokenCache().persistence).to.equal(msalCachePlugin);
  });

  it("does not set cachePlugin persistence when omitted", () => {
    const client = createMsalClient();

    expect(client.getTokenCache().persistence).to.be.undefined;
  });
});
