/**
 * Extracts auth-relevant headers from API responses for troubleshooting.
 * @param headers - Response headers object returned by the API client.
 * @returns A plain object with selected diagnostic headers.
 */
export function getAuthDebugHeaders(
  headers: Headers,
): Record<string, null | string> {
  return {
    contentType: headers.get("content-type"),
    resourceMetadata: headers.get("resource_metadata"),
    wwwAuthenticate: headers.get("www-authenticate"),
  };
}
