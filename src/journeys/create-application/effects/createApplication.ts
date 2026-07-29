import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";
import type { Session, SessionData } from "express-session";

import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";

import { ApiResponseError, ApiValidationError } from "#/api/api.errors.js";
import { CreateApplicationResponseBody } from "#/api/clients/rcw/model/createApplicationResponseBody.zod.gen.js";
import { getRcwApiDefaultOptions } from "#/api/getRcwApiDefaultOptions.js";
import { fromAnswers } from "#/journeys/create-application/Application.dto.js";
import { isJourneySession } from "#/journeys/effects.js";
import { logger } from "#/logger.js";
import { getAuthDebugHeaders } from "#/auth/auth.debug.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";

export const createApplication =
  (deps: CreateApplicationEffectsDeps) =>
  async (
    context: EffectFunctionContext,
    journeyCode: string,
  ): Promise<void> => {
    let response;

    try {
      const session = context.getSession() as
        (Partial<SessionData> & Session) | undefined;

      if (!isJourneySession(session)) {
        return;
      }

      const journeyAnswers = session.journeyDrafts?.[journeyCode];

      if (!journeyAnswers) {
        return;
      }

      const applicationDto = fromAnswers(journeyAnswers);

      const opts = await getRcwApiDefaultOptions({
        homeAccountId: session?.msal?.homeAccountId,
        sessionId: session?.id,
      });

      response = await deps.createApplication(applicationDto, opts);
    } catch (error) {
      logger.error(
        `Error creating application for journey ${journeyCode}:`,
        error,
        {
          api: "createApplication",
        },
      );
      throw ApiResponseError.from(error);
    }

    if (response.status !== HTTP_STATUS.CREATED) {
      logger.error(
        "createApplication did not return 201",
        {
          authHeaders: getAuthDebugHeaders(response.headers),
          data: response.data,
          status: response.status,
        },
        {
          api: "createApplication",
        },
      );
      throw new ApiResponseError();
    }

    console.log({ response });

    const result = CreateApplicationResponseBody.safeParse(response.data);

    if (!result.success) {
      logger.error(
        "createApplication response data failed validation",
        result.error,
      );
      throw ApiValidationError.from(result.error);
    }

    console.log({ result });
  };
