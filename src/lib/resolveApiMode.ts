export type ApiMode = "api" | "msw";

const DEFAULT_API_MODE: ApiMode = "msw";

// Precedence: service-specific mode, then legacy API_MODE fallback, then hard default.
/**
 * Resolves the effective API mode for a service.
 * @param serviceMode the service-specific mode (e.g. RCW_API_MODE)
 * @param legacyMode the legacy fallback mode (API_MODE)
 * @returns the resolved mode, defaulting to "msw"
 */
export function resolveApiMode(
  serviceMode: ApiMode | undefined,
  legacyMode: ApiMode | undefined,
): ApiMode {
  return serviceMode ?? legacyMode ?? DEFAULT_API_MODE;
}
