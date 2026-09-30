import * as Sentry from "@sentry/node";

import { BAD_REQUEST } from "#/lib/constants/http.js";

/**
 * Time a client operation and report its resolved HTTP status, if any.
 * @param endpoint - API operation name.
 * @param operation - Client operation to time.
 * @param isSuccess - Predicate for successful response statuses.
 * @returns The original client response.
 */
export async function time<Response extends { status: number }>(
  endpoint: string,
  operation: () => Promise<Response>,
  isSuccess: (status: number) => boolean = (status) => status < BAD_REQUEST,
): Promise<Response> {
  const startTime = performance.now();
  let status: number | undefined;
  const attributes: Record<string, number | string> = {
    endpoint,
    outcome: "error",
  };

  try {
    const response = await operation();
    ({ status } = response);
    attributes.outcome = isSuccess(response.status) ? "success" : "error";

    return response;
  } finally {
    if (status !== undefined) {
      attributes.status = status;
    }

    Sentry.metrics.distribution(
      "api_response_time",
      performance.now() - startTime,
      {
        attributes,
        unit: "millisecond",
      },
    );
  }
}
