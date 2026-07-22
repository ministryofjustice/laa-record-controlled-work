import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";

import { ApiValidationError } from "#/api/api.errors.js";
import { CreateApplicationResponseBody } from "#/api/client/model/createApplicationResponseBody.zod.gen.js";
import { fromAnswers } from "#/journeys/create-application/Application.dto.js";
import { isJourneySession } from "#/journeys/effects.js";
import { logger } from "#/logger.js";

export const createApplication =
  (deps: CreateApplicationEffectsDeps) =>
  (context: EffectFunctionContext, journeyCode: string): void => {
    const session = context.getSession();
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
      response = deps.createApplication(applicationDto);
    } catch (error) {
      logger.error(
        `Error creating application for journey ${journeyCode}:`,
        error,
      );
      throw error;
    }

    const result = CreateApplicationResponseBody.safeParse(response);

    if (!result.success) {
      logger.error(
        "createApplication response data failed validation",
        result.error,
      );
      throw ApiValidationError.from(result.error);
    }

    context.setData("caseId", result.data.id);

  };
