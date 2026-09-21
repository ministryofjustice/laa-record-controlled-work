import type { NextFunction, Request, Response } from "express";

import type { LoadApplicationForExportDeps } from "#/export/export.types.js";

import { NotFoundError } from "#/app/errors/NotFoundError.js";
import { ApplicationIdParam } from "#/app/route.types.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import { LoadApplicationForExportError } from "#/export/export.errors.js";
import { toExportApplicationViewModel } from "#/export/export.mappers.js";
import { loadApplicationForExport } from "#/export/export.service.js";
import { BAD_REQUEST, UNAUTHORIZED } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

export const createGetExportHandler =
  (deps: LoadApplicationForExportDeps) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Expires: "0",
      Pragma: "no-cache",
    });

    const parsedParams = ApplicationIdParam.safeParse(req.params);
    if (!parsedParams.success) {
      logger.warn("Invalid application ID for export", {
        error: parsedParams.error,
      });
      res.status(BAD_REQUEST).end();
      return;
    }

    const result = await loadApplicationForExport(deps, {
      applicationId: parsedParams.data.applicationId,
      homeAccountId: req.session.msal?.homeAccountId,
      selectedOfficeCode: req.session.selectedOffice?.code,
      sessionId: req.sessionID,
    });

    if (result.error) {
      if (result.error instanceof NotAuthenticatedError) {
        res.status(UNAUTHORIZED).end();
        return;
      }

      if (
        result.error instanceof NotFoundError ||
        result.error instanceof LoadApplicationForExportError
      ) {
        next(result.error);
        return;
      }

      next(result.error);
      return;
    }

    res.render(
      "export/application",
      toExportApplicationViewModel(result.value),
    );
  };
