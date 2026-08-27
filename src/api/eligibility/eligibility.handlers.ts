import type { NextFunction, Request, Response } from "express";

import type {
  LoadEligibilityAssessmentDeps,
  SaveEligibilityAssessmentDeps,
} from "#/api/eligibility/eligibility.service.js";

import {
  loadEligibilityAssessment,
  saveEligibilityAssessment,
} from "#/api/eligibility/eligibility.service.js";
import {
  ApplicationIdParam,
  PutEligibilityRequestBody,
} from "#/api/eligibility/eligibility.types.js";
import { BAD_REQUEST, OK, UNAUTHORIZED } from "#/app/enums/httpStatus.enum.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import { logger } from "#/logger.js";

export const createGetEligibilityHandler =
  (deps: LoadEligibilityAssessmentDeps) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsedParams = ApplicationIdParam.safeParse(req.params);

    if (!parsedParams.success) {
      logger.warn("Invalid application ID for eligibility assessment GET", {
        error: parsedParams.error,
      });
      res.status(BAD_REQUEST).end();
      return;
    }

    const { applicationId } = parsedParams.data;
    const result = await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: req.session.msal?.homeAccountId,
      sessionId: req.sessionID,
    });

    if (result.error) {
      if (result.error instanceof NotAuthenticatedError) {
        res.status(UNAUTHORIZED).end();
        return;
      }
      next(result.error);
      return;
    }

    res.json({ ...(result.value ?? {}) });
  };

export const createPutEligibilityHandler =
  (deps: SaveEligibilityAssessmentDeps) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsedParams = ApplicationIdParam.safeParse(req.params);
    if (!parsedParams.success) {
      logger.warn("Invalid application ID for eligibility assessment PUT", {
        error: parsedParams.error,
      });
      res.status(BAD_REQUEST).end();
      return;
    }

    const parsedBody = PutEligibilityRequestBody.safeParse(req.body);
    if (!parsedBody.success) {
      logger.warn("PUT Eligibility request body failed validation", {
        error: parsedBody.error,
      });
      res.status(BAD_REQUEST).end();
      return;
    }

    const { eligibility_assessment: eligibilityAssessment } = parsedBody.data;
    const { applicationId } = parsedParams.data;
    const result = await saveEligibilityAssessment(deps, {
      applicationId,
      eligibilityAssessment,
      homeAccountId: req.session.msal?.homeAccountId,
      sessionId: req.sessionID,
    });

    if (result.error) {
      if (result.error instanceof NotAuthenticatedError) {
        res.status(UNAUTHORIZED).end();
        return;
      }
      next(result.error);
      return;
    }

    res.status(OK).end();
  };
