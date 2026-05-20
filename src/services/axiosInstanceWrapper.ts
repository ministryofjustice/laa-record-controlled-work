import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import type { Middleware } from "middleware-axios";

export interface AxiosInstanceWrapper {
  axiosInstance: AxiosInstance;
  delete: AxiosInstance["delete"];
  get: AxiosInstance["get"];
  head: AxiosInstance["head"];
  options: AxiosInstance["options"];
  patch: AxiosInstance["patch"];
  post: AxiosInstance["post"];
  put: AxiosInstance["put"];
  request: (config: AxiosRequestConfig) => Promise<AxiosResponse>;
  use: <R = unknown>(middleware: Middleware<R>) => AxiosInstanceWrapper;
}
