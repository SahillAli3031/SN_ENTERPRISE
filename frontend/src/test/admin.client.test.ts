import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, setAuthTokenProvider, setUnauthorizedHandler } from "../api/client";

interface RecordedRequest {
  url: string;
  method: string;
  auth: string | null;
  body: unknown;
}

let recorded: RecordedRequest[];
let unauthorized: ReturnType<typeof vi.fn<() => void>>;

function installAdapter(
  handler: (request: RecordedRequest) => { status?: number; data?: unknown },
): void {
  api.defaults.adapter = (async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const request: RecordedRequest = {
      url: config.url ?? "",
      method: (config.method ?? "get").toLowerCase(),
      auth: ((config.headers.get("Authorization") as string | null | undefined) ?? null),
      body: typeof config.data === "string" ? JSON.parse(config.data) : (config.data ?? null),
    };
    recorded.push(request);
    const { status = 200, data } = handler(request);
    const response = { data, status, statusText: "", headers: {}, config } as AxiosResponse;
    if (status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${status}`,
        String(status),
        config,
        null,
        response,
      );
    }
    return response;
  });
}

describe("shared axios client authentication behaviour", () => {
  beforeEach(() => {
    recorded = [];
    unauthorized = vi.fn();
    setUnauthorizedHandler(unauthorized);
    setAuthTokenProvider(() => "test-token");
  });

  it("attaches the Bearer token to admin requests only", async () => {
    installAdapter(() => ({ data: { success: true, data: [] } }));

    await api.get("/reviews/all", { requiresAuth: true });
    await api.post("/auth/login", { email: "admin@example.com", password: "secret" });
    await api.post("/reviews", { name: "Jane", rating: 5 });
    await api.post("/enquiries", { fullName: "Jane" });
    await api.get("/gallery");

    expect(recorded).toHaveLength(5);
    expect(recorded[0].auth).toBe("Bearer test-token");
    // Public requests — login, review submission, enquiry submission, listings —
    // must never carry credentials.
    expect(recorded.slice(1).every((request) => request.auth === null)).toBe(true);
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it("invalidates the session on a 401 from an admin request", async () => {
    installAdapter(() => ({
      status: 401,
      data: { success: false, message: "Session expired or token invalid." },
    }));

    await expect(api.get("/reviews/all", { requiresAuth: true })).rejects.toBeTruthy();
    expect(unauthorized).toHaveBeenCalledTimes(1);
  });

  it("does not invalidate the session on a 401 from a public request", async () => {
    installAdapter(() => ({
      status: 401,
      data: { success: false, message: "Email or password is incorrect." },
    }));

    await expect(
      api.post("/auth/login", { email: "admin@example.com", password: "wrong" }),
    ).rejects.toBeTruthy();
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it("does not treat a 403 as an expired session", async () => {
    installAdapter(() => ({
      status: 403,
      data: { success: false, message: "You do not have permission to do that." },
    }));

    await expect(api.get("/gallery/all", { requiresAuth: true })).rejects.toBeTruthy();
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it("does not treat a 5xx response as an expired session", async () => {
    installAdapter(() => ({
      status: 500,
      data: { success: false, message: "Something went wrong on our side." },
    }));

    await expect(api.get("/enquiries", { requiresAuth: true })).rejects.toBeTruthy();
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it("does not treat a network failure as an expired session", async () => {
    api.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError("Network Error", "ERR_NETWORK", config, null, undefined);
    }) as typeof api.defaults.adapter;

    await expect(api.get("/auth/me", { requiresAuth: true })).rejects.toBeTruthy();
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it("restores the no-token default after tests that register providers", async () => {
    setAuthTokenProvider(() => null);
    installAdapter(() => ({ data: { success: true, data: [] } }));

    await api.get("/reviews/all", { requiresAuth: true });
    expect(recorded[0].auth).toBeNull();
  });
});
