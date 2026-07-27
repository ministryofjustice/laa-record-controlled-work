/* eslint-disable jsdoc/require-jsdoc -- exported helpers are intentionally compact. */

import * as applicationsApi from "#/api/client/schema/applications/applications.gen.js";
import {
  isRcwApiAuthContext,
  RCW_API_AUTH_CONTEXT_STATE_KEY,
} from "#/api/rcw-api-auth-context.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";

interface RcwApiClientConfig {
  operations?: RcwApiOperations;
}

interface RcwApiClientContext {
  getState: (key: string) => unknown;
}

type RcwApiOperations = Pick<typeof applicationsApi, "getApplications">;

export class RcwApiClient {
  private readonly operations: RcwApiOperations;

  private constructor(options: RcwApiClientConfig = {}) {
    this.operations = options.operations ?? applicationsApi;
  }

  static create(options: RcwApiClientConfig = {}): RcwApiClient {
    return new RcwApiClient(options);
  }

  private static async withAuthorization(
    context: RcwApiClientContext,
    options?: RequestInit,
  ): Promise<RequestInit> {
    const authContext = context.getState(RCW_API_AUTH_CONTEXT_STATE_KEY);
    if (!isRcwApiAuthContext(authContext)) {
      throw new NotAuthenticatedError();
    }

    const mergedHeaders = new Headers({
      Authorization: `Bearer ${await authContext.getBearerToken()}`,
    });

    new Headers(options?.headers).forEach((value, key) => {
      mergedHeaders.set(key, value);
    });

    return {
      ...options,
      headers: mergedHeaders,
    };
  }

  async getApplications(
    context: RcwApiClientContext,
    options?: RequestInit,
  ): ReturnType<RcwApiOperations["getApplications"]> {
    return await this.operations.getApplications(
      await RcwApiClient.withAuthorization(context, options),
    );
  }
}
