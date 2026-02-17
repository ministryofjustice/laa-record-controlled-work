import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { Middleware } from 'middleware-axios';

/**
 * Wrapper interface for AxiosInstance with middleware support.
 */
export interface AxiosInstanceWrapper {
  request: (config: AxiosRequestConfig) => Promise<AxiosResponse>;
  get: AxiosInstance['get'];
  delete: AxiosInstance['delete'];
  head: AxiosInstance['head'];
  options: AxiosInstance['options'];
  post: AxiosInstance['post'];
  put: AxiosInstance['put'];
  patch: AxiosInstance['patch'];
  axiosInstance: AxiosInstance;
  use: <R = unknown>(middleware: Middleware<R>) => AxiosInstanceWrapper;
}
