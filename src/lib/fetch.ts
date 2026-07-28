import config from "#/config.js";

const getBody = async (c: Request | Response): Promise<unknown> => {
  const contentType = c.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return await c.json();
  }

  return await c.text();
};

const getUrl = (contextUrl: string): string => {
  const { baseUrl } = config.api.rcw;

  const requestUrl = new URL(`${baseUrl}${contextUrl}`);
  return requestUrl.toString();
};

export const fetcher = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const requestUrl = getUrl(url);

  const requestInit: RequestInit = {
    ...options,
  };

  const response = await fetch(requestUrl, requestInit);
  const data = await getBody(response);
  const { headers, status } = response;
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
    Return shape matches the orval-generated T type at runtime */
  return { data, headers, status } as unknown as T;
};
