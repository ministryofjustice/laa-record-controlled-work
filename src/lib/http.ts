import { fetcher } from "#/lib/fetch.js";

const plainHeaders = (
  headers: HeadersInit | undefined,
): Record<string, string> => {
  if (
    !headers ||
    typeof headers !== "object" ||
    Array.isArray(headers) ||
    headers instanceof Headers
  ) {
    return {};
  }
  return headers;
};

/**
 * HTTP client providing CRUD operations.
 * Token injection (if needed) should be handled by callers via options.headers.
 */
export const http = {
  delete: async <T>(
    url: string,
    options?: Omit<RequestInit, "body" | "method">,
  ): Promise<T> => {
    return await fetcher<T>(url, { ...options, method: "DELETE" });
  },

  get: async <T>(
    url: string,
    options?: Omit<RequestInit, "body" | "method">,
  ): Promise<T> => {
    return await fetcher<T>(url, { ...options, method: "GET" });
  },

  patch: async <T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestInit, "body" | "method">,
  ): Promise<T> => {
    const headers = {
      "Content-Type": "application/json",
      ...plainHeaders(options?.headers),
    };

    return await fetcher<T>(url, {
      ...options,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
      method: "PATCH",
    });
  },

  post: async <T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestInit, "body" | "method">,
  ): Promise<T> => {
    const headers = {
      "Content-Type": "application/json",
      ...plainHeaders(options?.headers),
    };

    return await fetcher<T>(url, {
      ...options,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
      method: "POST",
    });
  },

  put: async <T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestInit, "body" | "method">,
  ): Promise<T> => {
    const headers = {
      "Content-Type": "application/json",
      ...plainHeaders(options?.headers),
    };

    return await fetcher<T>(url, {
      ...options,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
      method: "PUT",
    });
  },
};
