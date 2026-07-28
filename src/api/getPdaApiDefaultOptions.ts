import config from "#/config.js";

/**
 * Builds default authenticated options for downstream PDA API requests.
 * @returns API request options with the Authorization header.
 */
export function getPdaApiDefaultOptions(): RequestInit {
  return {
    headers: {
      Authorization: config.api.pda.key,
    },
  };
}
