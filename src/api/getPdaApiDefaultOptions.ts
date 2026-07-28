import type { Request } from "express";

import config from "#/config.js";

/**
 * Builds default authenticated options for downstream PDA API requests.
 * @param req - The Express request object to extract correlation ID from.
 * @returns API request options with Authorization, X-Authorization, and X-Correlation-Id headers.
 */
export function getPdaApiDefaultOptions(req: Request): RequestInit {
  const correlationId = req.headers["x-correlation-id"]?.toString();

  return {
    headers: {
      "X-Authorization": config.api.pda.key,
      ...(correlationId && { "X-Correlation-Id": correlationId }),
    },
  };
}
