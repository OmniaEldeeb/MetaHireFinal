import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { ApiException, type ApiEnvelope } from "./types";
import { clearToken, getToken } from "./session";
import { useNetworkStore } from "@/stores/network.store";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

// Interview microservice base URL. The tone/face/interview-session endpoints
// were split out into a separate service; everything else (auth, CVs, jobs,
// AI Q&A) stays on the main backend. Falls back to the main URL if unset, so
// nothing breaks when the env var is missing.
const MICRO_BASE_URL =
  process.env.NEXT_PUBLIC_INTERVIEW_API_BASE_URL ?? BASE_URL;

// Any request whose path starts with one of these is routed to the
// microservice. NOTE: "/ai-interview" intentionally does NOT match
// "/interview" (different prefix), so the AI Q&A endpoints remain on the main
// backend. "/interviews" (the list) does match and is on the microservice.
const MICRO_PREFIXES = ["/tone-interview", "/face-interview", "/interview"];

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

  // Send interview-microservice paths to the microservice base URL. Other
  // requests keep the instance default (main backend).
  const url = config.url ?? "";
  if (MICRO_PREFIXES.some((p) => url.startsWith(p))) {
    config.baseURL = MICRO_BASE_URL;
  }
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
  // Track in-flight requests for the global progress bar. inc() on send,
  // dec() in finally so it always clears on success AND failure.
  useNetworkStore.getState().inc();
  try {
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
  } finally {
    useNetworkStore.getState().dec();
  }
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