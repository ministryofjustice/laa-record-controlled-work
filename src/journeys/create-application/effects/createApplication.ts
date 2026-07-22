import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import { fromAnswers } from "#/journeys/create-application/Application.dto.js";
import { isJourneySession } from "#/journeys/effects.js";
import { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";
import { ApiResponseError, ApiValidationError } from "#/api/api.errors.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";
import { CreateApplicationResponseBody } from "#/api/client/model/createApplicationResponseBody.zod.gen.js";

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

    console.log(
      `Saving answers for journey ${journeyCode} to API:`,
      journeyAnswers,
    );

    const applicationDto = fromAnswers(journeyAnswers);

    try {
      response = deps.createApplication(applicationDto);
    } catch (error) {
      console.error(
        `Error creating application for journey ${journeyCode}:`,
        error,
      );
      throw error;
    }

    if (response.status !== HTTP_STATUS.OK) {
      logger.error("createApplication did not return 200", response, {
        api: "createApplication",
      });
      throw new ApiResponseError();
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

    console.log(
      `Mapped application DTO for journey ${journeyCode}:`,
      applicationDto,
    );
  };
