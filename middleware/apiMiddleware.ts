/**
 * Enhanced API Middleware
 *
 * Generalized version of MCC's axios middleware pattern.
 * Creates configurable axios instances with authentication, logging, and error handling.
 *
 * Based on MCC's utils/axiosSetup.ts patterns.
 */

import { devError, devLog } from "#src/lib/index.js";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { NextFunction, Request, Response } from "express";
import { create } from "middleware-axios";

const DEFAULT_TIMEOUT = 5000;
const HTTP_UNAUTHORIZED = 401;

// Configuration interface for API middleware
export interface ApiMiddlewareConfig {
  /** Default timeout for requests */
  timeout?: number;
  /** Default headers to include with all requests */
  defaultHeaders?: Record<string, string>;
  /** Whether to enable request/response logging */
  enableLogging?: boolean;
  /** Optional auth service for JWT handling */
  authService?: AuthServiceInterface | null;
}

// Auth service interface - compatible with MCC's auth service
export interface AuthServiceInterface {
  getAuthHeader: () => Promise<string>;
  clearTokens: () => void;
}

/**
 * Convert unknown error to Error instance
 * @param {unknown} error Error to convert
 * @returns {Error} Error instance
 */
function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Type guard for axios error with response
 * @param {unknown} error Error to check
 * @returns {boolean} True if error has response with status
 */
function isAxiosErrorWithResponse(
  error: unknown,
): error is AxiosError & { response: { status: number } } {
  return (
    error !== null &&
    typeof error === "object" &&
    "response" in error &&
    error.response !== null &&
    typeof error.response === "object" &&
    "status" in error.response &&
    typeof (error.response as { status: unknown }).status === "number"
  );
}

/**
 * Create API middleware with configuration
 * @param {ApiMiddlewareConfig} config Configuration for the API middleware
 * @returns {Function} Express middleware function
 */
export function createApiMiddleware(config: ApiMiddlewareConfig = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    defaultHeaders = {},
    enableLogging = true,
    authService = null,
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Create axios instance with default config (based on MCC pattern)
    const axiosWrapper = create({
      timeout,
      headers: {
        "Content-Type": "application/json",
        ...defaultHeaders,
      },
    });

    // Add request logging interceptor if enabled
    if (enableLogging) {
      axiosWrapper.axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          devLog(
            `API Request: ${config.method?.toUpperCase()} ${config.baseURL ?? ""}${config.url ?? ""}`,
          );
          return config;
        },
        async (error: unknown) => {
          devError(`API Request Error: ${toError(error).message}`);
          return await Promise.reject(toError(error));
        },
      );

      // Add response logging interceptor
      axiosWrapper.axiosInstance.interceptors.response.use(
        (response) => {
          devLog(
            `API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
          );
          return response;
        },
        async (error: unknown) => {
          if (isAxiosErrorWithResponse(error)) {
            devError(
              `API Response Error: ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
            );
          } else {
            devError(`API Network Error: ${toError(error).message}`);
          }
          return await Promise.reject(toError(error));
        },
      );
    }

    // Add JWT authentication interceptor if auth service provided (based on MCC pattern)
    if (authService !== null) {
      // Request interceptor for JWT auth
      axiosWrapper.axiosInstance.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
          try {
            config.headers.Authorization = await authService.getAuthHeader();
            if (enableLogging) {
              devLog("Added JWT authorization header to API request");
            }
          } catch (error) {
            devError(
              `Failed to add JWT authorization header: ${toError(error).message}`,
            );
            // Continue without auth header - API will handle 401 response
          }
          return config;
        },
        async (error: unknown) => await Promise.reject(toError(error)),
      );

      // Response interceptor for 401 error handling (based on MCC pattern)
      axiosWrapper.axiosInstance.interceptors.response.use(
        (response) => response,
        async (error: unknown) => {
          if (
            isAxiosErrorWithResponse(error) &&
            error.response.status === HTTP_UNAUTHORIZED
          ) {
            if (enableLogging) {
              devError(
                "API returned 401 Unauthorized - clearing cached tokens",
              );
            }
            authService.clearTokens();
          }
          return await Promise.reject(toError(error));
        },
      );
    }

    req.axiosMiddleware = axiosWrapper;
    next();
  };
}

/**
 * Default API middleware with standard configuration
 * Compatible with existing template usage
 */
export const axiosMiddleware = createApiMiddleware();
