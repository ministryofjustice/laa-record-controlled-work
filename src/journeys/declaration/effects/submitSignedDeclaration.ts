import { AnswerKey as A } from "#/journeys/AnswerKey.js";
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
  (deps: DeclarationDeps) => (context: DeclarationContext) => {
    const applicationId = context.getRequestParam("applicationId");
    const confirmed = context.getAnswer(A.DECLARATION_SIGNED_CONFIRM);
    const date = context.getAnswer(A.DECLARATION_SIGNED_DATE);

    logger.error(`applicationId: ${applicationId}`);
    logger.error(`confirmed: ${confirmed}`);
    logger.error(`date: ${date}`);

    // TODO Need an endpoint in the RCW API to update the application with the signed declaration.
  };

export const validateSignedDeclaration = (): boolean => {
  return false;
};
