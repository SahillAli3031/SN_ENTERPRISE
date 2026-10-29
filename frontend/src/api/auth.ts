import { api, getErrorMessage } from "./client";
import type { ApiEnvelope, AuthSession, AuthUser } from "../types";

/**
 * POST /api/auth/login — public endpoint.
 *
 * Deliberately not marked `requiresAuth`: no Bearer token is attached, and a
 * `401` here (wrong credentials) never invalidates an existing session.
 */
export async function loginRequest(email: string, password: string): Promise<AuthSession> {
  try {
    const { data } = await api.post<ApiEnvelope<AuthSession>>("/auth/login", { email, password });
    const session = data.data;
    if (!session?.token || !session.user) {
      throw new Error("The server response was incomplete. Please try again.");
    }
    return session;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Sign-in failed. Please try again."));
  }
}

/**
 * GET /api/auth/me — revalidates the stored token against the server.
 *
 * Errors are intentionally NOT wrapped: the auth store inspects the HTTP
 * status (`401`/`404` = signed out, anything else = temporary failure) before
 * deciding whether the session is actually lost.
 */
export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<ApiEnvelope<AuthUser>>("/auth/me", { requiresAuth: true });
  if (!data.data?.id) {
    throw new Error("The server returned an unexpected session response.");
  }
  return data.data;
}
