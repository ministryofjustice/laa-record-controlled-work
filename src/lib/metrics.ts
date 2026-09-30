import * as Sentry from "@sentry/node";

export interface MetricAttributes extends Record<string, unknown> {
  endpoint: string;
  status?: number;
}

/**
 * Record the elapsed time for an RCW API request.
 * @param startTime - The timestamp returned by `start`.
 * @param attributes - Attributes to attach to the Sentry metric.
 */
export function duration(
  startTime: number,
  attributes: MetricAttributes,
): void {
  const elapsed = performance.now() - startTime;
  Sentry.metrics.distribution("api_response_time", elapsed, {
    attributes,
    unit: "millisecond",
  });
}

/**
 * Start timing an RCW API request.
 * @returns The request start timestamp.
 */
export function start(): number {
  return performance.now();
}
