import { fetch } from "@tauri-apps/plugin-http";

type HTTPRequestParameters = {
  json?: Record<string, any>;
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean>;
};

export class HTTPError extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.status = status;
    this.statusText = statusText;
  }
}

const responseParser = async <T>(res: Response) => {
  const hasContent = Number(res.headers.get("content-length")) > 0;

  const isTextResponse =
    res.headers.get("content-type") === "text/plain; charset=utf-8";

  const response = (
    hasContent
      ? isTextResponse
        ? { message: await res.text() }
        : res.json()
      : undefined
  ) as T;

  if (!res.ok) {
    throw new HTTPError(
      isTextResponse
        ? (response as { message: string })?.["message"]
        : JSON.stringify(response ?? ""),
      res.status,
      res.statusText,
    );
  }

  return response;
};

const request = ({
  headers: baseHeaders,
}: Pick<HTTPRequestParameters, "headers"> = {}) => {
  const prefixUrl = import.meta.env.VITE_APP_BASE_URL;

  const defaultHeaders = {
    Accept: "application/json text/html",
  };

  const url = (
    endpoint: string,
    queryParams?: HTTPRequestParameters["queryParams"],
  ) => {
    const url = prefixUrl ? new URL(endpoint, prefixUrl).href : endpoint;

    if (queryParams && Object.keys(queryParams).length) {
      const params = Object.entries(queryParams).reduce<Record<string, string>>(
        (acc, [k, v]) => ({ ...acc, [k]: String(v) }),
        {},
      );

      return `url?${new URLSearchParams(params).toString()}`;
    }

    return url;
  };

  const get = async <T>(
    endpoint: string,
    { headers, queryParams }: HTTPRequestParameters = {},
  ) => {
    const response = await fetch(url(endpoint, queryParams), {
      method: "GET",
      headers: { ...defaultHeaders, ...baseHeaders, ...headers },
      proxy: {
        http: {
          url: "http://127.0.0.1:8080/",
        },
      },
    });

    return responseParser<T>(response);
  };

  const post = async <T>(
    endpoint: string,
    { headers, json, queryParams }: HTTPRequestParameters = {},
  ) => {
    const response = await fetch(url(endpoint, queryParams), {
      method: "POST",
      headers: {
        ...baseHeaders,
        ...headers,
        ...(json ? { "Content-Type": "application/json" } : {}),
      },
      body: json ? JSON.stringify(json) : "",
      proxy: {
        http: {
          url: "http://127.0.0.1:8080/",
        },
      },
    });

    return responseParser<T>(response);
  };

  return {
    get,
    post,
  };
};

export { request };
