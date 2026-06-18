import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { ApiException, type ApiEnvelope } from "./types";
import { clearToken, getToken } from "./session";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    // Skip the ngrok free-tier interstitial that would otherwise break JSON.
    "ngrok-skip-browser-warning": "true",
  },
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    if (status === 401) {
      clearToken();
      if (typeof window !== "undefined" && !location.pathname.startsWith("/login")) {
        const next = encodeURIComponent(location.pathname + location.search);
        location.href = `/login?next=${next}`;
      }
    }

    const isEnvelope = body && typeof body === "object" && "result" in body;
    throw new ApiException({
      status,
      code: isEnvelope && "code" in body ? (body.code as string) : "NETWORK_ERROR",
      message:
        (isEnvelope && "message" in body && (body.message as string)) ||
        error.message ||
        "Something went wrong. Please try again.",
      fieldErrors:
        isEnvelope && "meta" in body
          ? (body.meta as { errors?: Record<string, string[]> })?.errors
          : undefined,
      retryAfter:
        isEnvelope && "meta" in body
          ? (body.meta as { retry_after?: number })?.retry_after
          : undefined,
    });
  },
);

/**
 * Call this once after the auth store is ready to wire 429 toasts.
 * Keeps the client independent of React during SSR.
 */
export function installRateLimitHandler(
  push: (t: { kind: "error"; title: string; message?: string }) => void,
) {
  http.interceptors.response.use(undefined, (error) => {
    const ex = error as { status?: number; retryAfter?: number; message?: string };
    if (ex.status === 429) {
      const after = ex.retryAfter;
      push({
        kind: "error",
        title: "Too many requests",
        message: after ? `Try again in ${after}s.` : "Please slow down.",
      });
    }
    return Promise.reject(error);
  });
}

/** Unwraps the `{ result, data }` envelope and returns `data`. */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await http.request<ApiEnvelope<T>>(config);
  const body = res.data;
  if (body && typeof body === "object" && "result" in body && !body.result) {
    const err = body as Extract<ApiEnvelope<T>, { result: false }>;
    throw new ApiException({
      status: res.status,
      code: err.code,
      message: err.message,
      fieldErrors: err.meta?.errors,
      retryAfter: err.meta?.retry_after,
    });
  }
  // Most endpoints nest under `data`; a few (e.g. /auth/me) are top-level.
  return (body as { data?: T }).data ?? (body as T);
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "GET", url }),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "POST", url, data }),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "PUT", url, data }),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "PATCH", url, data }),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "DELETE", url }),
};
