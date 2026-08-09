import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";
import type { Session, SessionData } from "express-session";

import type { CreateApplicationRequestBody } from "#/api/clients/rcw/model/createApplicationRequestBody.zod.gen.js";
import type { createApplicationResponse } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";

import {
  ApiResponseError,
  ApiValidationError,
} from "#/api/clients/api.errors.js";
import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import { CreateApplicationResponseBody } from "#/api/clients/rcw/model/createApplicationResponseBody.zod.gen.js";
import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import { getAuthDebugHeaders } from "#/auth/auth.debug.js";
import { Answers } from "#/journeys/create-application/data/answers.zod.js";
import { isJourneySession } from "#/journeys/effects.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

const buildApplicationData = (
  journeyAnswers: Record<string, unknown>,
  journeyCode: string,
): CreateApplicationRequestBody => {
  const answersFormatted = Answers.safeParse(journeyAnswers);

  if (!answersFormatted.success) {
    logger.error(
      `Journey answers for journey ${journeyCode} failed validation`,
      answersFormatted.error,
    );
    throw ApiValidationError.from(answersFormatted.error);
  }

  const applicationDto = ApplicationDto.fromAnswers(answersFormatted.data);
  return applicationDto.toRcwApi();
};

export const createApplication =
  (deps: CreateApplicationEffectsDeps) =>
  async (
    context: EffectFunctionContext,
    journeyCode: string,
  ): Promise<void> => {
    let response: createApplicationResponse;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Session shape is constrained by app session typing.
      const session = context.getSession() as
        (Partial<SessionData> & Session) | undefined;

      if (!isJourneySession(session)) {
        return;
      }

      const journeyAnswers = session.journeyDrafts?.[journeyCode];

      if (!journeyAnswers) {
        return;
      }

      const dataForApi = buildApplicationData(journeyAnswers, journeyCode);

      const opts = await getRcwApiDefaultOptions({
        homeAccountId: session.msal?.homeAccountId,
        sessionId: session.id,
      });

      response = await deps.createApplication(dataForApi, opts);
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

    const result = CreateApplicationResponseBody.safeParse(response.data);

    if (!result.success) {
      logger.error(
        "createApplication response data failed validation",
        result.error,
      );
      throw ApiValidationError.from(result.error);
    }

    context.setData(CONTEXT_DATA_KEYS.applicationID, result.data.id);
  };
