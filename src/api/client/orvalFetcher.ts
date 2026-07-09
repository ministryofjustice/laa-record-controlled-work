import { http } from "#/lib/http.js";

/**
 * Orval mutator that adapts the HTTP client to Orval's expected interface.
 * Orval generates client functions that call this mutator with a URL and options.
 *
 * @param url - The API endpoint path
 * @param options - Request options including method, body, headers
 * @returns Parsed response with data, headers, and status
 */
export const orvalFetcher = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const method = (options.method || "GET").toUpperCase();

  switch (method) {
    case "POST":
      return http.post<T>(url, options.body, options);
    case "PUT":
      return http.put<T>(url, options.body, options);
    case "PATCH":
      return http.patch<T>(url, options.body, options);
    case "DELETE":
      return http.delete<T>(url, options);
    case "GET":
    default:
      return http.get<T>(url, options);
  }
};
