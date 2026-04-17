/* eslint-disable @typescript-eslint/no-magic-numbers -- This is a cleaner way to define and destructure variables */
export const HTTP_STATUS = {
  FOUND: 302,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const {
  FOUND,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
} = HTTP_STATUS;
