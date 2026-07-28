const TEST_API_KEY = "test-api-key";

/**
 * Builds default authenticated options for downstream PDA API requests.
 * @returns API request options with the Authorization header.
 */
export function getPdaApiDefaultOptions(): RequestInit {
  if (process.env.NODE_ENV === "test") {
    return {
      headers: {
        Authorization: TEST_API_KEY,
      },
    };
  }

  return {
    headers: {
      Authorization: "StaticToken ",
    },
  };
}
