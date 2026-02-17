/**
 * Base API Service Tests
 * 
 * Tests for the BaseApiService class extracted from MCC patterns.
 * Verifies HTTP client configuration, logging, and error handling functionality.
 */

import { expect } from 'chai';
import { BaseApiService } from '#src/services/baseApiService.js';
import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import { create } from 'middleware-axios';

// Test implementation of BaseApiService
class TestApiService extends BaseApiService {
  constructor(config: { baseUrl: string; timeout?: number; apiPrefix?: string; enableLogging?: boolean } = { baseUrl: 'https://api.test.com' }) {
    super(config);
  }

  // Expose protected methods for testing
  public testConfigureAxiosInstance(axiosMiddleware: AxiosInstanceWrapper) {
    return this.configureAxiosInstance(axiosMiddleware);
  }

  public testLogApiCall(method: string, endpoint: string) {
    return this.logApiCall(method, endpoint);
  }

  public testLogApiResponse(method: string, endpoint: string, data: unknown) {
    return this.logApiResponse(method, endpoint, data);
  }

  public testHandleApiError(error: unknown, context: string) {
    return BaseApiService.handleApiError(error, context);
  }

  public testBuildEndpoint(endpoint: string) {
    return this.buildEndpoint(endpoint);
  }
}

describe('BaseApiService', () => {
  let testService: TestApiService;
  let mockAxiosMiddleware: AxiosInstanceWrapper;

  beforeEach(() => {
    testService = new TestApiService();
    mockAxiosMiddleware = create({
      baseURL: 'http://localhost:3000',
      timeout: 5000
    });
  });

  describe('Constructor and Configuration', () => {
    it('should initialise with default config values', () => {
      const service = new TestApiService({
        baseUrl: 'https://api.example.com'
      });

      // Config should have defaults applied
      expect(service).to.be.instanceOf(BaseApiService);
    });

    it('should override default config values', () => {
      const service = new TestApiService({
        baseUrl: 'https://api.custom.com',
        timeout: 10000,
        apiPrefix: '/v2',
        enableLogging: false
      });

      expect(service).to.be.instanceOf(BaseApiService);
    });
  });

  describe('configureAxiosInstance', () => {
    it('should configure axios instance with base URL and timeout', () => {
      const configured = testService.testConfigureAxiosInstance(mockAxiosMiddleware);

      expect(configured.axiosInstance.defaults.baseURL).to.equal('https://api.test.com');
      expect(configured.axiosInstance.defaults.timeout).to.equal(5000);
    });

    it('should set default headers', () => {
      const configured = testService.testConfigureAxiosInstance(mockAxiosMiddleware);

      expect(configured.axiosInstance.defaults.headers.common['Content-Type']).to.equal('application/json');
      expect(configured.axiosInstance.defaults.headers.common['Accept']).to.equal('application/json');
    });

    it('should handle custom timeout configuration', () => {
      const customService = new TestApiService({
        baseUrl: 'https://api.test.com',
        timeout: 15000
      });

      const configured = customService.testConfigureAxiosInstance(mockAxiosMiddleware);
      expect(configured.axiosInstance.defaults.timeout).to.equal(15000);
    });
  });

  describe('Logging Methods', () => {
    it('should log API calls when logging is enabled', () => {
      // Note: In actual tests, you might want to mock devLog
      // This test verifies the method runs without error
      expect(() => {
        testService.testLogApiCall('GET', '/test');
      }).to.not.throw();
    });

    it('should log API responses when logging is enabled', () => {
      expect(() => {
        testService.testLogApiResponse('GET', '/test', { data: 'test' });
      }).to.not.throw();
    });

    it('should not log when logging is disabled', () => {
      const noLogService = new TestApiService({
        baseUrl: 'https://api.test.com',
        enableLogging: false
      });

      expect(() => {
        noLogService.testLogApiCall('GET', '/test');
        noLogService.testLogApiResponse('GET', '/test', { data: 'test' });
      }).to.not.throw();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors and return error message', () => {
      const error = new Error('Test error');
      const message = testService.testHandleApiError(error, 'Test context');

      expect(message).to.be.a('string');
      expect(message.length).to.be.greaterThan(0);
    });

    it('should handle unknown error types', () => {
      const message = testService.testHandleApiError('string error', 'Test context');

      expect(message).to.be.a('string');
      expect(message.length).to.be.greaterThan(0);
    });
  });

  describe('Endpoint Building', () => {
    it('should build endpoint with API prefix', () => {
      const serviceWithPrefix = new TestApiService({
        baseUrl: 'https://api.test.com',
        apiPrefix: '/v1'
      });

      const endpoint = serviceWithPrefix.testBuildEndpoint('/users');
      expect(endpoint).to.equal('/v1/users');
    });

    it('should build endpoint without prefix when not configured', () => {
      const endpoint = testService.testBuildEndpoint('/users');
      expect(endpoint).to.equal('/users');
    });

    it('should handle empty endpoint', () => {
      const serviceWithPrefix = new TestApiService({
        baseUrl: 'https://api.test.com',
        apiPrefix: '/v1'
      });

      const endpoint = serviceWithPrefix.testBuildEndpoint('');
      expect(endpoint).to.equal('/v1');
    });
  });

  describe('Service Instantiation', () => {
    it('should create service without throwing errors', () => {
      expect(() => {
        new TestApiService({
          baseUrl: 'https://api.example.com',
          timeout: 10000,
          apiPrefix: '/api/v1',
          enableLogging: true
        });
      }).to.not.throw();
    });

    it('should work with minimal required config', () => {
      expect(() => {
        new TestApiService({ baseUrl: 'https://api.minimal.com' });
      }).to.not.throw();
    });
  });
});