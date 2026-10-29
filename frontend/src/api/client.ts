import axios, { AxiosError } from "axios";

declare module "axios" {
  /**
   * Marks an authenticated ("admin") request. Only requests that set it carry
   * the Bearer token, and only their `401` responses invalidate the session.
   * Public requests (review submission, public listings, login) never set it.
   */
  export interface AxiosRequestConfig<D = any, P = any> {
    requiresAuth?: boolean;
  }
}

/**
 * Shared axios instance. `VITE_API_BASE_URL` points at the Express API in
 * development (proxied through Vite) or at the deployed origin in production.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

type AuthTokenProvider = () => string | null;
type UnauthorizedHandler = () => void;

let authTokenProvider: AuthTokenProvider | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * The auth store registers itself here instead of this module importing the
 * store, which keeps `client ↔ authStore ↔ api` free of circular imports.
 */
export function setAuthTokenProvider(provider: AuthTokenProvider): void {
  authTokenProvider = provider;
}

/** Reports "session lost" events (admin-request `401`s) back to the auth store. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

api.interceptors.request.use((config) => {
  const token = config.requiresAuth && authTokenProvider ? authTokenProvider() : null;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const wasAuthRequest = error.config?.requiresAuth === true;
      // Only a 401 from an authenticated request means the session is gone.
      // 403 (permission), network failures and 5xx (server) are surfaced by
      // the calling UI and must never sign the user out.
      if (status === 401 && wasAuthRequest && unauthorizedHandler) unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

/** Extract a human readable message from any thrown error. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message = axiosError.response?.data?.message;
    if (message) return message;
    if (!axiosError.response) return "We couldn't reach the server. Please check your connection and try again.";
    return fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
