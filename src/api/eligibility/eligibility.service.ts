import type {
  getApplication,
  updateApplicationMeans,
} from "#/api/clients/rcw/schema/applications/applications.gen.js";

import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import {
  LoadEligibilityAssessmentError,
  SaveEligibilityAssessmentError,
} from "#/api/eligibility/eligibility.errors.js";
import { HTTP_STATUS } from "#/app/enums/httpStatus.enum.js";
import { getAuthDebugHeaders } from "#/auth/auth.debug.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import { type Either, failure, success } from "#/lib/either.js";
import { logger } from "#/logger.js";

export interface EligibilityAssessment {
  data: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface LoadEligibilityAssessmentDeps {
  getApplication: typeof getApplication;
}

export interface LoadEligibilityAssessmentParams {
  applicationId: string;
  homeAccountId: string | undefined;
  sessionId: string | undefined;
}

export interface SaveEligibilityAssessmentDeps {
  updateApplicationMeans: typeof updateApplicationMeans;
}

export interface SaveEligibilityAssessmentParams {
  applicationId: string;
  eligibilityAssessment: Record<string, unknown>;
  homeAccountId: string | undefined;
  sessionId: string | undefined;
}

/**
 * Loads a previously completed eligibility assessment for an application, if one exists.
 * @param deps - RCW API client dependencies.
 * @param params - Application and session/resource identifiers.
 * @returns An `Either` success (the assessment, or `undefined` if none/malformed exists), or a
 * `NotAuthenticatedError`/`LoadEligibilityAssessmentError` failure.
 */
export async function loadEligibilityAssessment(
  deps: LoadEligibilityAssessmentDeps,
  params: LoadEligibilityAssessmentParams,
): Promise<
  Either<
    LoadEligibilityAssessmentError | NotAuthenticatedError,
    EligibilityAssessment | undefined
  >
> {
  const { applicationId, homeAccountId, sessionId } = params;

  let response;
  try {
    const opts = await getRcwApiDefaultOptions({ homeAccountId, sessionId });

    response = await deps.getApplication(applicationId, opts);
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return failure(error);
    }

    logger.error(
      "Error loading application for eligibility assessment",
      error,
      {
        api: "getApplication",
      },
    );
    return failure(LoadEligibilityAssessmentError.from(error));
  }

  if (response.status !== HTTP_STATUS.OK) {
    logger.error(
      "getApplication did not return 200",
      {
        authHeaders: getAuthDebugHeaders(response.headers),
        data: response.data,
        status: response.status,
      },
      {
        api: "getApplication",
      },
    );
    return failure(new LoadEligibilityAssessmentError());
  }

  const parsed = Application.safeParse(response.data);

  if (!parsed.success) {
    logger.error(
      "getApplication response data failed validation",
      parsed.error,
    );
    return failure(LoadEligibilityAssessmentError.from(parsed.error));
  }

  const { data, result } = parsed.data.eligibility ?? {};

  if (!isRecord(data) || !isRecord(result)) {
    return success(undefined);
  }

  return success({ data, result });
}

/**
 * Saves the CCQ eligibility assessment as application means data via the RCW API.
 * @param deps - RCW API client dependencies.
 * @param params - Assessment payload and session/resource identifiers.
 * @returns An `Either` success, or the `NotAuthenticatedError`/`SaveEligibilityAssessmentError` failure.
 */
export async function saveEligibilityAssessment(
  deps: SaveEligibilityAssessmentDeps,
  params: SaveEligibilityAssessmentParams,
): Promise<
  Either<NotAuthenticatedError | SaveEligibilityAssessmentError, void>
> {
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
    return failure(SaveEligibilityAssessmentError.from(error));
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
    return failure(new SaveEligibilityAssessmentError());
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
