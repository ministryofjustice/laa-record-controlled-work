import type { ExpressLocaleLoader } from "#src/lib/index.js";
import type { AxiosInstanceWrapper } from "./axios-instance-wrapper.js";

declare global {
  namespace Express {
    interface Request {
      axiosMiddleware: AxiosInstanceWrapper;
      locale: ExpressLocaleLoader;
    }
  }
}
