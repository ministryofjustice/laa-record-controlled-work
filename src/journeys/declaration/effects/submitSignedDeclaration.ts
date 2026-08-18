import { ApiResponseError } from "#/api/clients/api.errors.js";
import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import { updateApplicationDeclaration } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import { getAuthDebugHeaders } from "#/auth/auth.debug.js";
import { AnswerKey as A } from "#/journeys/AnswerKey.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

import type {
  DeclarationContext,
  DeclarationDeps,
} from "../declaration.types.js";

/**
 * Handle submission of the signed declaration.
 * @param deps  Journey dependencies.
 * @returns void
 */
export const submitSignedDeclaration =
  (deps: DeclarationDeps) => async (context: DeclarationContext) => {
    const session = context.getSession();
    const applicationId = context.getRequestParam("applicationId");
    const confirmed = context.getAnswer(A.DECLARATION_SIGNED_CONFIRM);
    const date = context.getAnswer(A.DECLARATION_SIGNED_DATE);

    if (!session) {
      logger.error("Missing session");
      throw new Error("Missing session");
    }

    if (!applicationId) {
      logger.error("Missing applicationId in request parameters");
      throw new Error("Missing applicationId in request parameters");
    }

    let response;

    try {
      const body = {
        dateSigned: date,
        declarationConfirmation: confirmed === "yes",
      };

      const opts = await getRcwApiDefaultOptions({
        homeAccountId: session.msal?.homeAccountId,
        sessionId: session.id,
      });

      response = await updateApplicationDeclaration(applicationId, body, opts);
    } catch (error) {
      logger.error("Failed to update application declaration", error, {
        api: "updateApplicationDeclaration",
      });
      throw ApiResponseError.from(error);
    }

    if (response.status !== HTTP_STATUS.NO_CONTENT) {
      const error = new ApiResponseError();
      logger.error("createApplication did not return 204", error, {
        api: "updateApplicationDeclaration",
        authHeaders: getAuthDebugHeaders(response.headers),
        data: null,
        status: response.status,
      });
      throw error;
    }
  };
