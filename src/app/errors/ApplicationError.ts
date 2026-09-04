/* eslint-disable jsdoc/require-jsdoc -- Not required */

import { HTTP_STATUS } from "#/lib/constants/http.js";

export class ApplicationError extends Error {
  statusCode?: number;

  constructor(message: string) {
    super();
    this.name = "ApplicationError";
    this.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
}
