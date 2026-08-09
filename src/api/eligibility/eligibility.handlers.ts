import type { NextFunction, Request, Response } from "express";

import type { SaveApplicationMeansDeps } from "#/api/eligibility/eligibility.service.js";

import { saveApplicationMeans } from "#/api/eligibility/eligibility.service.js";
import { SaveRequestBody } from "#/api/eligibility/eligibility.types.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

export const createSaveHandler =
  (deps: SaveApplicationMeansDeps) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = SaveRequestBody.safeParse(req.body);

    if (!parsed.success) {
      logger.warn("Save request body failed validation", {
        error: parsed.error,
      });
      res.status(HTTP_STATUS.BAD_REQUEST).end();
      return;
    }

    const {
      eligibility_assessment: eligibilityAssessment,
      resource_id: resourceId,
    } = parsed.data;

    const result = await saveApplicationMeans(deps, {
      eligibilityAssessment,
      homeAccountId: req.session.msal?.homeAccountId,
      applicationId: resourceId,
      sessionId: req.sessionID,
    });

    if (result.error) {
      if (result.error instanceof NotAuthenticatedError) {
        res.status(HTTP_STATUS.UNAUTHORIZED).end();
        return;
      }

      next(result.error);
      return;
    }

    res.status(HTTP_STATUS.OK).end();
  };
