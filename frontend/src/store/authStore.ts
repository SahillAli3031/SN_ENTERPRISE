import axios from "axios";
import { create } from "zustand";
import { fetchMe, loginRequest } from "../api/auth";
import { getErrorMessage, setAuthTokenProvider, setUnauthorizedHandler } from "../api/client";
import type { AuthUser } from "../types";

/** sessionStorage key — chosen over localStorage so the token dies with the tab. */
export const AUTH_TOKEN_KEY = "verdant_admin_token";

export type AuthStatus = "loading" | "authed" | "guest";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  /** Non-blocking notice: expired session, or a failed session re-check. */
  sessionNotice: string | null;
  login(email: string, password: string): Promise<void>;
  /** Confirms the stored token via GET /auth/me; keeps the session on temporary failures. */
  revalidate(): Promise<void>;
  logout(notice?: string | null): void;
}

/** Read live from storage: the store's initial state is computed at import time. */
export function hasStoredToken(): boolean {
  return readStoredToken() !== null;
}

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    else sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode) — the in-memory token still works.
  }
}

function httpStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/** True once GET /auth/me has confirmed the current token. */
let validated = false;
/** In-flight revalidation promise (dedupes StrictMode's double effect). */
let revalidation: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  token: readStoredToken(),
  user: null,
  status: readStoredToken() ? "loading" : "guest",
  sessionNotice: null,

  async login(email: string, password: string) {
    set({ sessionNotice: null });
    const session = await loginRequest(email, password);
    writeStoredToken(session.token);
    validated = true;
    set({ token: session.token, user: session.user, status: "authed", sessionNotice: null });
  },

  async revalidate() {
    const state = get();
    // A token can appear in storage after this module was initialised.
    const token = state.token ?? readStoredToken();
    if (!token) {
      if (state.status !== "guest") set({ token: null, user: null, status: "guest" });
      return;
    }
    if (revalidation) return revalidation;
    if (validated && state.status === "authed" && state.user) return;
    set({ token, status: state.status === "authed" ? "authed" : "loading" });

    revalidation = (async () => {
      try {
        const user = await fetchMe();
        validated = true;
        set({ token, user, status: "authed", sessionNotice: null });
      } catch (error) {
        const status = httpStatus(error);
        if (status === 401 || status === 404) {
          // Authentication failed: token invalid/expired or the account is gone.
          writeStoredToken(null);
          validated = false;
          set({
            token: null,
            user: null,
            status: "guest",
            sessionNotice: "Your session has expired. Please sign in again.",
          });
        } else {
          // Temporary failure (offline, 5xx, rate limited): keep the session.
          // The backend still authorises every admin request server-side.
          const reason = getErrorMessage(error, "no connection");
          validated = false;
          set({
            status: "authed",
            sessionNotice: `We couldn't verify your session (${reason}). Some data may not load — refresh to try again.`,
          });
        }
      } finally {
        revalidation = null;
      }
    })();

    return revalidation;
  },

  logout(notice: string | null = null) {
    writeStoredToken(null);
    validated = false;
    set({ token: null, user: null, status: "guest", sessionNotice: notice });
  },
}));

// One consistent auth layer: the Axios client asks this store for the token
// and reports admin-request 401s back to it. The client never imports the store.
setAuthTokenProvider(() => useAuthStore.getState().token);
setUnauthorizedHandler(() => {
  const state = useAuthStore.getState();
  if (!state.token && state.status === "guest") return; // stray 401 while signed out
  state.logout("Your session has expired. Please sign in again.");
});
