import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";
import type { Session, SessionData } from "express-session";

import type { UpdateEvidenceRequestBody } from "#/api/clients/rcw/model/updateEvidenceRequestBody.zod.gen.js";
import type { EvidenceEffectsDeps } from "#/journeys/evidence/evidence.types.js";

import {
  ApiResponseError,
  ApiValidationError,
} from "#/api/clients/api.errors.js";
import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import { getAuthDebugHeaders } from "#/auth/auth.debug.js";
import { isJourneySession } from "#/journeys/effects.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

const buildEvidenceData = (
  answers: Record<string, unknown>,
  journeyCode: string,
): UpdateEvidenceRequestBody => {
  if (answers.doYouHaveEvidence === "no") {
    return {
      evidenceExemptionCode:
        typeof answers.reasonForNoEvidence === "string"
          ? answers.reasonForNoEvidence
          : undefined,
      evidenceExemptionReason:
        typeof answers.moreDetailsForNoEvidence === "string"
          ? answers.moreDetailsForNoEvidence
          : undefined,
    };
  }

  if (answers.doYouHaveEvidence === "yes") {
    return {
      incomeEvidenceChecklist: {
        employedEvidence: answers.employedEvidence,
        selfEmployedEvidence: answers.selfEmployedEvidence,
        benefitsInKindEvidence: answers.benefitsInKindEvidence,
        otherEvidence: answers.otherEvidence,
        stateBenefitsEvidence: answers.stateBenefitsEvidence,
        asylumSupportEvidence: answers.asylumSupportEvidence,
        taxCreditsEvidence: answers.taxCreditsEvidence,
      },
      expenditureCapitalEvidenceChecklist: {
        incomeEvidence: answers.incomeEvidence,
        housingCostsEvidence: answers.housingCostsEvidence,
        childCareEvidence: answers.childCareEvidence,
        maintenanceEvidence: answers.maintenanceEvidence,
        capitalEvidence: answers.capitalEvidence,
      },
    };
  }

  logger.warn(
    `Journey ${journeyCode} has unexpected doYouHaveEvidence value: ${String(answers.doYouHaveEvidence)}`,
  );
  throw new ApiValidationError();
};

export const updateEvidence =
  (deps: EvidenceEffectsDeps) =>
  async (
    context: EffectFunctionContext,
    journeyCode: string,
  ): Promise<void> => {
    let response;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Session shape is constrained by app session typing.
      const session = context.getSession() as
        (Partial<SessionData> & Session) | undefined;

      if (!isJourneySession(session)) {
        return;
      }

      const applicationId = session.currentApplicationId;
      if (!applicationId) {
        logger.error(
          `No currentApplicationId in session for journey ${journeyCode}`,
        );
        throw new Error("applicationId is required to update evidence");
      }
      context.setData(CONTEXT_DATA_KEYS.applicationID, applicationId);

      const journeyAnswers = session.journeyDrafts?.[journeyCode];
      if (!journeyAnswers) {
        return;
      }

      const dataForApi = buildEvidenceData(journeyAnswers, journeyCode);

      const opts = await getRcwApiDefaultOptions({
        homeAccountId: session.msal?.homeAccountId,
        sessionId: session.id,
      });

      response = await deps.updateApplicationEvidence(
        applicationId,
        dataForApi,
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
