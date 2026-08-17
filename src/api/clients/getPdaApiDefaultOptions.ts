import config from "#/config.js";

/**
 * Builds default authenticated options for downstream PDA API requests.
 * @param correlationId Optional correlation ID to include in the request headers.
 * @param extraHeaders Optional additional headers to include in the request.
 * @returns API request options with X-Authorization and X-Correlation-Id headers.
 */
export function getPdaApiDefaultOptions(
  correlationId?: string,
  extraHeaders?: Record<string, string>,
): RequestInit {
  return {
    headers: {
      "X-Authorization": config.api.pda.key,
      ...(correlationId && { "X-Correlation-Id": correlationId }),
      ...extraHeaders,
    },
  };
}
