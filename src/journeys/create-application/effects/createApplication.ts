import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";

import { ApiValidationError } from "#/api/api.errors.js";

import { fromAnswers } from "#/journeys/create-application/Application.dto.js";
import { isJourneySession } from "#/journeys/effects.js";
import { logger } from "#/logger.js";

import type { AccountInfo } from "@azure/msal-node";
import type { Session } from "express-session";
import { CreateApplicationResponseBody } from "#/api/clients/rcw/model/createApplicationResponseBody.zod.gen.js";

interface SessionInterface extends Session {
  /** @property account User account, retrieved from MSAL/Entra after successful authentication. */
  account: AccountInfo | undefined;
  /** @property isAuthenticated True when the user has been successfully authenticated. */
  isAuthenticated: boolean | undefined;
  /** @property journeyDrafts Forge drafts of the user's current journey. */
  journeyDrafts: Record<string, unknown> | undefined;
  /** @property returnTo URI to return to after authentication flow completes. */
  returnTo: string | undefined;
}

export const createApplication =
  (deps: CreateApplicationEffectsDeps) =>
  async (context: EffectFunctionContext, journeyCode: string): Promise<void> => {
    const session = context.getSession() as SessionInterface;
    let response;

    if (!isJourneySession(session)) {
      return;
    }

    const journeyAnswers = session.journeyDrafts?.[journeyCode];

    if (!journeyAnswers) {
      return;
    }

    const applicationDto = fromAnswers(journeyAnswers);
    try {
      const token: string | undefined = session.account?.idToken;

      const opts: RequestInit = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      response = await deps.createApplication(applicationDto, opts);
    } catch (error) {
      logger.error(
        `Error creating application for journey ${journeyCode}:`,
        error,
      );
      throw error;
    }

console.log({ response: response });

    const result = CreateApplicationResponseBody.safeParse(response);
 
    if (!result.success) {
      logger.error(
        "createApplication response data failed validation",
        result.error,
      );
      throw ApiValidationError.from(result.error);
    }

    context.setData("caseId", result.data.id);

    console.log({ result: result });
  };
