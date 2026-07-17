import {
  ConfidentialClientApplication,
  type ICachePlugin,
} from "@azure/msal-node";

import { msalConfig } from "#/auth/auth.config.js";

interface MsalClientConfig {
  msalCachePlugin?: ICachePlugin;
}

/**
 * Creates an MSAL confidential client with optional token cache persistence.
 * @param options - MSAL client options.
 * @returns A configured MSAL confidential client.
 */
export function createMsalClient(
  options: MsalClientConfig = {},
): ConfidentialClientApplication {
  const { msalCachePlugin } = options;

  return new ConfidentialClientApplication({
    ...msalConfig,
    cache: {
      cachePlugin: msalCachePlugin,
    },
  });
}
