import type { UpdateEvidenceRequestBody } from "#/api/clients/rcw/model/updateEvidenceRequestBody.zod.gen.js";

import { ApiResponseError } from "#/api/clients/api.errors.js";
import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import { HTTP_STATUS } from "#/app/enums/httpStatus.enum.js";
import { getAuthDebugHeaders } from "#/auth/auth.debug.js";
import {
  type EvidenceContext,
  type EvidenceEffectsDeps,
  isEvidenceAnswers,
} from "#/journeys/evidence/evidence.types.js";
import { mapEvidenceToEvidenceRequest } from "#/journeys/evidence/mappers/mapEvidenceToEvidenceRequest.js";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import {
  InvalidEvidenceError,
  InvalidSessionError,
} from "#/journeys/journey.errors.js";
import { logger } from "#/logger.js";

export const updateEvidence =
  (deps: EvidenceEffectsDeps) =>
  async (context: EvidenceContext, journeyCode: string): Promise<void> => {
    let response;

    try {
      const session = context.getSession();

      if (!session) {
        throw new InvalidSessionError();
      }

      const applicationId = context.getRequestParam(PARAMS_KEYS.applicationID);

      if (!applicationId) {
        logger.error("applicationID parameter is missing");
        throw new Error("applicationID parameter is required");
      }

      const journeyAnswers = session.journeyDrafts?.[journeyCode];
      if (!journeyAnswers) {
        return;
      }

      if (!isEvidenceAnswers(journeyAnswers)) {
        logger.warn(`Journey ${journeyCode} has invalid evidence answers`);
        throw new InvalidEvidenceError();
      }

      const updateEvidenceReq: UpdateEvidenceRequestBody =
        mapEvidenceToEvidenceRequest(journeyAnswers);

      const opts = await getRcwApiDefaultOptions({
        homeAccountId: session.msal?.homeAccountId,
        sessionId: session.id,
      });

      response = await deps.updateApplicationEvidence(
        applicationId,
        updateEvidenceReq,
        opts,
      );
    } catch (error) {
      logger.error(
        `Error updating evidence for journey ${journeyCode}:`,
        error,
        { api: "updateApplicationEvidence" },
      );
      throw ApiResponseError.from(error);
    }

    if (response.status !== HTTP_STATUS.NO_CONTENT) {
      logger.error(
        "updateApplicationEvidence did not return 204",
        {
          authHeaders: getAuthDebugHeaders(response.headers),
          data: response.data,
          status: response.status,
        },
        { api: "updateApplicationEvidence" },
      );
      throw new ApiResponseError();
    }
  };
