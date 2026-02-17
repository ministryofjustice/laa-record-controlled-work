/**
 * Base API Service
 * 
 * Generalised foundation for creating API services based on MCC's apiService.ts patterns.
 * Provides common HTTP client configuration, logging, and error handling utilities.
 * 
 * Domain services extend this class to implement specific API logic while reusing
 * connection protocol and configuration patterns.
 * 
 * Based on MCC's production-tested patterns from src/services/apiService.ts
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { AxiosResponse } from 'axios';
import { devLog, extractAndLogError } from '#src/scripts/helpers/index.js';

// Constants to avoid magic numbers
const DEFAULT_TIMEOUT_MS = 5000;
const JSON_STRINGIFY_INDENT = 2;

// Base configuration interface for API services
export interface BaseApiConfig {
  /** Base URL for the API */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** API prefix/version path (e.g., '/latest/mock', '/v1', '/api') */
  apiPrefix?: string;
  /** Whether to enable request/response logging */
  enableLogging?: boolean;
}

/**
 * Base API Service Class
 * 
 * Provides common functionality extracted from MCC's ApiService:
 * - Axios instance configuration with API-specific settings
 * - Request/response logging using MCC's patterns
 * - Common error handling utilities
 * - URL construction with API prefixes
 * 
 * Domain services extend this class and implement their own:
 * - Response transformation logic
 * - Business-specific error handling
 * - API endpoint definitions
 */
export abstract class BaseApiService {
  protected config: Required<BaseApiConfig>;

  /**
   * Initialise BaseApiService with configuration
   * @param {BaseApiConfig} config Configuration object for the API service
   */
  constructor(config: BaseApiConfig) {
    const { timeout = DEFAULT_TIMEOUT_MS, apiPrefix = '', enableLogging = true, ...rest } = config;
    this.config = {
      timeout,
      apiPrefix,
      enableLogging,
      ...rest
    };
  }

  /**
   * Configure axios instance with API-specific settings
   * Extracted from MCC's ApiService.configureAxiosInstance method
   * 
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from Express request
   * @returns {AxiosInstanceWrapper} Configured axios instance
   */
  protected configureAxiosInstance(axiosMiddleware: AxiosInstanceWrapper): AxiosInstanceWrapper {
    const { axiosInstance } = axiosMiddleware;
    const { defaults } = axiosInstance;
    const {config} = this;

    // Configure base URL - from MCC pattern
    const { baseUrl } = config;
    if (baseUrl !== '') {
      defaults.baseURL = baseUrl;
    }

    // Configure timeout - from MCC pattern
    const ZERO_TIMEOUT = 0;
    const { timeout } = config;
    if (timeout !== ZERO_TIMEOUT && !Number.isNaN(timeout)) {
      defaults.timeout = timeout;
    }

    // Set default headers - from MCC pattern
    const { headers } = defaults;
    headers.common['Content-Type'] = 'application/json';
    headers.common.Accept = 'application/json';

    return axiosMiddleware;
  }

  /**
   * Log API request using MCC's logging pattern
   * 
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   */
  protected logApiCall(method: string, endpoint: string): void {
    if (this.config.enableLogging) {
      devLog(`API: ${method} ${this.config.apiPrefix}${endpoint}`);
    }
  }

  /**
   * Log API response using MCC's logging pattern
   * 
   * @param {string} method - HTTP method  
   * @param {string} endpoint - API endpoint
   * @param {unknown} data - Response data
   */
  protected logApiResponse(method: string, endpoint: string, data: unknown): void {
    if (this.config.enableLogging) {
      devLog(`API: ${method} ${this.config.apiPrefix}${endpoint} response: ${JSON.stringify(data, null, JSON_STRINGIFY_INDENT)}`);
    }
  }

  /**
   * Handle API errors using MCC's error handling pattern
   * 
   * @param {unknown} error - Error from API call
   * @param {string} context - Context string for logging
   * @returns {string} User-friendly error message
   */
  protected static handleApiError(error: unknown, context: string): string {
    return extractAndLogError(error, context);
  }

  /**
   * Build full endpoint URL with API prefix
   * 
   * @param {string} endpoint - Relative endpoint path
   * @returns {string} Full endpoint path with prefix
   */
  protected buildEndpoint(endpoint: string): string {
    return `${this.config.apiPrefix}${endpoint}`;
  }

  /**
   * Make a GET request with MCC's patterns
   * 
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} endpoint - API endpoint path
   * @param {object} params - Query parameters
   * @returns {Promise<AxiosResponse>} Promise resolving to axios response
   */
  protected async get<T = unknown>(
    axiosMiddleware: AxiosInstanceWrapper,
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<AxiosResponse<T>> {
    const fullEndpoint = this.buildEndpoint(endpoint);
    this.logApiCall('GET', endpoint);

    const configuredAxios = this.configureAxiosInstance(axiosMiddleware);
    const response = await configuredAxios.get<T>(fullEndpoint, { params });

    this.logApiResponse('GET', endpoint, response.data);
    return response;
  }

  /**
   * Make a POST request with MCC's patterns
   * 
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} endpoint - API endpoint path
   * @param {unknown} data - Request body data
   * @returns {Promise<AxiosResponse>} Promise resolving to axios response
   */
  protected async post<T = unknown>(
    axiosMiddleware: AxiosInstanceWrapper,
    endpoint: string,
    data?: unknown
  ): Promise<AxiosResponse<T>> {
    const fullEndpoint = this.buildEndpoint(endpoint);
    this.logApiCall('POST', endpoint);

    const configuredAxios = this.configureAxiosInstance(axiosMiddleware);
    const response = await configuredAxios.post<T>(fullEndpoint, data);

    this.logApiResponse('POST', endpoint, response.data);
    return response;
  }

  /**
   * Make a PUT request with MCC's patterns
   * 
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} endpoint - API endpoint path
   * @param {unknown} data - Request body data
   * @returns {Promise<AxiosResponse>} Promise resolving to axios response
   */
  protected async put<T = unknown>(
    axiosMiddleware: AxiosInstanceWrapper,
    endpoint: string,
    data?: unknown
  ): Promise<AxiosResponse<T>> {
    const fullEndpoint = this.buildEndpoint(endpoint);
    this.logApiCall('PUT', endpoint);

    const configuredAxios = this.configureAxiosInstance(axiosMiddleware);
    const response = await configuredAxios.put<T>(fullEndpoint, data);

    this.logApiResponse('PUT', endpoint, response.data);
    return response;
  }

  /**
   * Make a PATCH request with MCC's patterns
   * 
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} endpoint - API endpoint path
   * @param {unknown} data - Request body data
   * @returns {Promise<AxiosResponse>} Promise resolving to axios response
   */
  protected async patch<T = unknown>(
    axiosMiddleware: AxiosInstanceWrapper,
    endpoint: string,
    data?: unknown
  ): Promise<AxiosResponse<T>> {
    const fullEndpoint = this.buildEndpoint(endpoint);
    this.logApiCall('PATCH', endpoint);

    const configuredAxios = this.configureAxiosInstance(axiosMiddleware);
    const response = await configuredAxios.patch<T>(fullEndpoint, data);

    this.logApiResponse('PATCH', endpoint, response.data);
    return response;
  }

  /**
   * Make a DELETE request with MCC's patterns
   * 
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} endpoint - API endpoint path
   * @returns {Promise<AxiosResponse>} Promise resolving to axios response
   */
  protected async delete<T = unknown>(
    axiosMiddleware: AxiosInstanceWrapper,
    endpoint: string
  ): Promise<AxiosResponse<T>> {
    const fullEndpoint = this.buildEndpoint(endpoint);
    this.logApiCall('DELETE', endpoint);

    const configuredAxios = this.configureAxiosInstance(axiosMiddleware);
    const response = await configuredAxios.delete<T>(fullEndpoint);

    this.logApiResponse('DELETE', endpoint, response.data);
    return response;
  }
}