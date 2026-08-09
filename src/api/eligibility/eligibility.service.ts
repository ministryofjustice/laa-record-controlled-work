import type { updateApplicationMeans } from "#/api/clients/rcw/schema/applications/applications.gen.js";

import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import { SaveApplicationMeansError } from "#/api/eligibility/eligibility.errors.js";
import { getAuthDebugHeaders } from "#/auth/auth.debug.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { type Either, failure, success } from "#/lib/either.js";
import { logger } from "#/logger.js";

export interface SaveApplicationMeansDeps {
  updateApplicationMeans: typeof updateApplicationMeans;
}

export interface SaveApplicationMeansParams {
  applicationId: string;
  eligibilityAssessment: Record<string, unknown>;
  homeAccountId: string | undefined;
  sessionId: string | undefined;
}

/**
 * Saves the CCQ eligibility assessment as application means data via the RCW API.
 * @param deps - RCW API client dependencies.
 * @param params - Assessment payload and session/resource identifiers.
 * @returns An `Either` success, or the `NotAuthenticatedError`/`SaveApplicationMeansError` failure.
 */
export async function saveApplicationMeans(
  deps: SaveApplicationMeansDeps,
  params: SaveApplicationMeansParams,
): Promise<Either<NotAuthenticatedError | SaveApplicationMeansError, void>> {
  const { applicationId, eligibilityAssessment, homeAccountId, sessionId } =
    params;

  const { data, result } = splitEligibilityAssessment(eligibilityAssessment);

  let response;
  try {
    const opts = await getRcwApiDefaultOptions({
      homeAccountId,
      sessionId,
    });

    response = await deps.updateApplicationMeans(
      applicationId,
      { data, result },
      opts,
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return failure(error);
    }

    logger.error("Error saving application means data", error, {
      api: "updateApplicationMeans",
    });
    return failure(SaveApplicationMeansError.from(error));
  }

  if (response.status !== HTTP_STATUS.NO_CONTENT) {
    logger.error(
      "updateApplicationMeans did not return 204",
      {
        authHeaders: getAuthDebugHeaders(response.headers),
        data: response.data,
        status: response.status,
      },
      {
        api: "updateApplicationMeans",
      },
    );
    return failure(new SaveApplicationMeansError());
  }

  return success(undefined);
}

/**
 * Narrows a value to a plain object record.
 * @param value - Value to check.
 * @returns Whether the value is a non-null, non-array object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Splits the CCQ eligibility assessment payload into the datastore's `data`/`result` shape.
 * @param eligibilityAssessment - Full CCQ session data (Q&A answers plus the CFE response).
 * @returns `data` (Q&A content) and `result` (the CFE response held under `api_response`).
 */
function splitEligibilityAssessment(
  eligibilityAssessment: Record<string, unknown>,
): { data: Record<string, unknown>; result: Record<string, unknown> } {
  const { api_response: apiResponse, ...data } = eligibilityAssessment;
  return {
    data,
    result: isRecord(apiResponse) ? apiResponse : {},
  };
}
