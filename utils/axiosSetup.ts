/**
 * Axios middleware setup for Express applications
 * 
 * Provides enhanced axios middleware with configurable instances,
 * authentication support, logging, and error handling.
 */

export { axiosMiddleware, createApiMiddleware } from '#src/middleware/apiMiddleware.js';
export type { ApiMiddlewareConfig, AuthServiceInterface } from '#src/middleware/apiMiddleware.js';
