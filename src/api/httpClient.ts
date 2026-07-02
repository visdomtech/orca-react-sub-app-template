const DEFAULT_TIMEOUT = 30_000;
const DEV_API_BASE = "https://devorcaapi.doublefin.com";
const DEV_API_KEY = "mgyyywu3ntetnzizms00yjfkltkwmwetmwrlmduzzjzmztmw";

export class HttpError extends Error {
  response?: { code?: string; message?: string; error?: string };

  constructor(
    message: string,
    response?: { code?: string; message?: string; error?: string }
  ) {
    super(message);
    this.name = "HttpError";
    this.response = response;
  }
}

function isProduction(): boolean {
  return window.location.host.endsWith(".doublefin.com");
}

async function orcaFetch(path: string, init?: RequestInit): Promise<Response> {
  if (isProduction()) {
    return fetch(path, init);
  }

  const url = `${DEV_API_BASE}${path}`;
  const { credentials: _unused, ...rest } = init ?? {};
  const devHeaders = {
    ...(rest.headers as Record<string, string>),
    "X-doublefin-api-key": DEV_API_KEY,
  };
  return fetch(url, { ...rest, headers: devHeaders });
}

async function rawRequest<R>(
  method: string,
  endpoint: string,
  payload?: unknown
): Promise<R> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await orcaFetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody: { code?: string; message?: string; error?: string } | undefined;
      try {
        errorBody = await response.json();
      } catch {
        // response body is not JSON
      }
      throw new HttpError(
        errorBody?.error ?? errorBody?.message ?? `HTTP ${response.status}: ${response.statusText}`,
        errorBody
      );
    }

    if (response.status === 204) return undefined as R;
    return response.json() as Promise<R>;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof HttpError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new HttpError("Request timed out");
    }
    throw new HttpError(error instanceof Error ? error.message : "Network error");
  }
}

export const httpClient = {
  get: <R>(endpoint: string): Promise<R> =>
    rawRequest<R>("GET", endpoint),
  post: <R, P = unknown>(endpoint: string, payload: P): Promise<R> =>
    rawRequest<R>("POST", endpoint, payload),
  put: <R, P = unknown>(endpoint: string, payload: P): Promise<R> =>
    rawRequest<R>("PUT", endpoint, payload),
  patch: <R, P = unknown>(endpoint: string, payload: P): Promise<R> =>
    rawRequest<R>("PATCH", endpoint, payload),
  delete: <R>(endpoint: string): Promise<R> =>
    rawRequest<R>("DELETE", endpoint),
};
