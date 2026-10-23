const API_BASE_URL = "/api/v1";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Base fetch wrapper that includes credentials and the dev mode header.
 * All API calls go through this function.
 */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Check for dev mode token
  const devToken = typeof window !== "undefined"
    ? sessionStorage.getItem("brkroutnxdle:devToken")
    : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
    ...(devToken ? { "X-Dev-Access-Token": devToken } : {}),
  };

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  fetchOptions.signal?.addEventListener("abort", onAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
      credentials: "include", // sends HttpOnly cookies
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Cannot reach the calendar API. Check the server and your connection, then retry.", 0);
  } finally {
    clearTimeout(timeout);
    fetchOptions.signal?.removeEventListener("abort", onAbort);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(
        "HTTP_ERROR",
        `Request failed with status ${response.status} (no response body)`,
        response.status,
      );
    }
    throw new ApiError("PARSE_ERROR", "Failed to parse response as JSON", response.status);
  }

  if (!response.ok) {
    const envelope = json as { error?: { code?: string; message?: string; details?: Record<string, unknown> } } | null;
    throw new ApiError(
      envelope?.error?.code ?? "HTTP_ERROR",
      envelope?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      envelope?.error?.details,
    );
  }

  if (typeof json !== "object" || json === null || !Object.prototype.hasOwnProperty.call(json, "data")) {
    throw new ApiError("PARSE_ERROR", "Calendar API returned an invalid response. Retry after checking the server.", response.status);
  }
  return (json as { data: T }).data;
}

export class ApiError extends Error {
  public details?: Record<string, unknown>;

  constructor(
    public code: string,
    message: string,
    public status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.details = details;
  }
}

// Convenience methods
export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    apiFetch<T>(path, { params }),

  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};

export function isAuthTokenExpiredError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "AUTH_EXPIRED";
}

export function calendarErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return error instanceof Error ? error.message : "Unknown error. Retry.";
  if (error.code === "NETWORK_ERROR") return "Cannot reach the calendar API. Check your connection and that the server is running, then retry.";
  if (error.status === 401) return "Session expired or unauthorized. Sign in again or enter a valid development token, then retry.";
  if (error.status === 403) return "Google Calendar access denied. Check calendar permissions and reconnect Google, then retry.";
  if (error.status === 404) return "Calendar not found. Check the selected calendar and reconnect Google, then retry.";
  if (error.status === 502) return "Google Calendar is temporarily unavailable. Retry shortly or check the upstream service.";
  return error.message;
}
