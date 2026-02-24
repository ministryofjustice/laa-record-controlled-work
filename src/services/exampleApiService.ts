/**
 * Example API Service
 * 
 * Simple demonstration of how to use BaseApiService for basic HTTP operations.
 * This example shows the minimal pattern without domain-specific logic that
 * template users would need to remove.
 * 
 * Template users should:
 * - Replace this with their own API service
 * - Add their own response types and transformations
 * - Implement their own business logic methods
 */

import { BaseApiService } from './baseApiService.js';
import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { AxiosResponse } from 'axios';

/**
 * Simple API Service for JSONPlaceholder demo
 * 
 * Demonstrates basic usage of BaseApiService without complex domain logic.
 * Template users can use this as a starting point for their own API services.
 */
export class ExampleApiService extends BaseApiService {
  /**
   * Initialise ExampleApiService with JSONPlaceholder configuration
   */
  constructor() {
    const EXAMPLE_TIMEOUT_MS = 10000;
    super({
      baseUrl: process.env.EXAMPLE_API_URL ?? 'https://jsonplaceholder.typicode.com',
      timeout: EXAMPLE_TIMEOUT_MS,
      apiPrefix: '', // JSONPlaceholder doesn't use a prefix
      enableLogging: true
    });
  }

  /**
   * Get users from API - minimal example
   * 
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {Record<string, string | number | boolean>} params - Query parameters
   * @returns {Promise<AxiosResponse>} Promise resolving to raw axios response
   */
  async getUsers(
    axiosMiddleware: AxiosInstanceWrapper,
    params: Record<string, string | number | boolean> = {}
  ): Promise<AxiosResponse> {
    return await this.get(axiosMiddleware, '/users', params);
  }

  /**
   * Get single user by ID - minimal example
   * 
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string | number} userId - User ID to retrieve
   * @returns {Promise<AxiosResponse>} Promise resolving to raw axios response
   */
  async getUserById(
    axiosMiddleware: AxiosInstanceWrapper,
    userId: string | number
  ): Promise<AxiosResponse> {
    return await this.get(axiosMiddleware, `/users/${userId}`);
  }

  /**
   * Create a new user - minimal example
   * 
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {unknown} userData - User data to create
   * @returns {Promise<AxiosResponse>} Promise resolving to raw axios response
   */
  async createUser(
    axiosMiddleware: AxiosInstanceWrapper,
    userData: unknown
  ): Promise<AxiosResponse> {
    return await this.post(axiosMiddleware, '/users', userData);
  }
}

// Export singleton instance
export const exampleApiService = new ExampleApiService();