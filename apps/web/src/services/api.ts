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

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: "include", // sends HttpOnly cookies
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN_ERROR",
      json.error?.message ?? "An unknown error occurred",
      response.status,
    );
  }

  return json.data as T;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
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