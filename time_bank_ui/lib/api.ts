const configuredBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
const localBackendLike = /^https?:\/\/(127\.0\.0\.1|localhost):8000(\/api)?\/?$/i.test(configuredBase);
const localApiLike = /^\/api\/?$/i.test(configuredBase);
const shouldUseLocalProxy = !configuredBase || localBackendLike || localApiLike;
const API_BASE_URL = (shouldUseLocalProxy ? "/dj" : configuredBase).replace(/\/+$/, "");

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiRequestOptions = {
  method?: RequestMethod;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
  const response = await fetch(url, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.detail || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}
