import type { getApplication } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type {
  ExportApplication,
  LoadApplicationForExportDeps,
  LoadApplicationForExportParams,
} from "#/export/export.types.js";

import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import { NotFoundError } from "#/app/errors/NotFoundError.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import { LoadApplicationForExportError } from "#/export/export.errors.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { type Either, failure, success } from "#/lib/either.js";
import { logger } from "#/logger.js";

/**
 * Loads and validates an application for export.
 * @param deps - The RCW API client dependencies.
 * @param params - The application and session identifiers.
 * @returns The validated application or a typed loading failure.
 */
export async function loadApplicationForExport(
  deps: LoadApplicationForExportDeps,
  params: LoadApplicationForExportParams,
): Promise<
  Either<
    LoadApplicationForExportError | NotAuthenticatedError | NotFoundError,
    ExportApplication
  >
> {
  let response: Awaited<ReturnType<typeof getApplication>>;

  try {
    const options = await getRcwApiDefaultOptions({
      homeAccountId: params.homeAccountId,
      sessionId: params.sessionId,
    });

    response = await deps.getApplication(params.applicationId, options);
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return failure(error);
    }

    logger.error("Error loading application for export", undefined, {
      api: "getApplication",
      failure: "client",
    });
    return failure(new LoadApplicationForExportError());
  }

  if (response.status === HTTP_STATUS.UNAUTHORIZED) {
    logger.warn("RCW API rejected export authentication", {
      api: "getApplication",
      status: response.status,
    });
    return failure(new NotAuthenticatedError());
  }

  if (
    response.status === HTTP_STATUS.FORBIDDEN ||
    response.status === HTTP_STATUS.NOT_FOUND
  ) {
    logger.warn("RCW API couldn't find application with ID", {
      api: "getApplication",
      status: response.status,
    });
    return failure(new NotFoundError());
  }

  if (response.status !== HTTP_STATUS.OK) {
    logger.error("RCW API returned an unexpected export response", undefined, {
      api: "getApplication",
      status: response.status,
    });
    return failure(new LoadApplicationForExportError());
  }

  const parsed = Application.safeParse(response.data);
  if (!parsed.success) {
    logger.error("RCW API export response failed validation", undefined, {
      api: "getApplication",
      failure: "schema",
    });
    return failure(new LoadApplicationForExportError());
  }

  if (
    params.selectedOfficeCode === undefined ||
    parsed.data.providerOfficeCode !== params.selectedOfficeCode
  ) {
    return failure(new NotFoundError());
  }

  return success(parsed.data);
}
