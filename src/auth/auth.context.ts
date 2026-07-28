import type { AccountInfo } from "@azure/msal-node";
import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";
import type { SessionData } from "express-session";

import { EntraService } from "#/auth/entra.service.js";
import { createMsalClient } from "#/auth/msal.client.js";
import { RedisCachePlugin } from "#/auth/msal.plugin.js";
import config from "#/config.js";
import { getRedisClient } from "#/lib/redis.js";

/**
 * Auth context container.
 *
 * Wraps Entra Service auth, allowing:
 * - Creation from various contexts (e.g. Forge effect)
 * - Generation of useful outputs (e.g. request headers)
 */
export class AuthContext {
  account: AccountInfo | undefined;
  authService: EntraService;

  /**
   * Constructor.
   * @param sessionId Request session ID.
   * @param account Account from auth token.
   * @returns void
   */
  constructor(sessionId: string, account: AccountInfo | undefined) {
    this.authService = AuthContext.createEntraService(sessionId);
    this.account = account;
  }

  /**
   * Create a new instance from a Forge effect context.
   * @param context  Forge effect context.
   * @returns AuthContext
   */
  static fromForgeContext(context: EffectFunctionContext): AuthContext {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Using our expected session shape.
    const session = context.getSession() as SessionData;
    const { account, id: sessionId } = session;

    return new AuthContext(sessionId, account);
  }

  /**
   * Create a new Entra Service instance.
   * @param sessionId Request session ID.
   * @returns EntraService
   * @private
   */
  private static createEntraService(sessionId: string): EntraService {
    const msalCachePlugin = new RedisCachePlugin(
      getRedisClient(),
      sessionId,
      config.redis.maxAge,
    );
    const msalClient = createMsalClient({ msalCachePlugin });
    return EntraService.create({ msalClient });
  }

  /**
   * Adds the `Authorization` header to an existing Headers instance.
   * @param headers Request headers object.
   * @returns object Headers object.
   */
  async appendAuthorizationHeader(headers: Headers): Promise<Headers> {
    if (!this.account) {
      throw new Error("Missing account");
    }

    const authResponse = await this.authService.acquireTokenSilent(
      this.account,
    );

    if (authResponse.error) {
      throw new Error("Failed to get token");
    }

    const token = authResponse.value.accessToken;
    headers.set("Authorization", `Bearer: ${token}`);
    return headers;
  }
}
