import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../api/client";
import { AdminReviewModerationPage } from "../pages/admin/AdminReviewModerationPage";
import { AUTH_TOKEN_KEY, useAuthStore } from "../store/authStore";

interface RecordedRequest {
  url: string;
  method: string;
  auth: string | null;
  statusParam?: string;
  body?: Record<string, unknown>;
}

let reviews: Array<Record<string, unknown>>;
let recorded: RecordedRequest[];

function installAdapter(): void {
  api.defaults.adapter = (async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const method = (config.method ?? "get").toLowerCase();
    const url = config.url ?? "";
    const statusParam = (config.params as { status?: string } | undefined)?.status;
    const body =
      typeof config.data === "string" ? (JSON.parse(config.data) as Record<string, unknown>) : undefined;
    const auth = ((config.headers.get("Authorization") as string | null | undefined) ?? null);
    recorded.push({ url, method, auth, statusParam, body });

    let status = 200;
    let data: unknown = { success: true, data: [] };

    if (method === "get" && url === "/reviews/all") {
      const rows = statusParam
        ? reviews.filter((row) => row.status === statusParam)
        : [...reviews];
      data = { success: true, data: rows, meta: { total: rows.length } };
    } else if (method === "patch" && url.startsWith("/reviews/")) {
      const id = url.slice("/reviews/".length);
      const target = reviews.find((row) => row._id === id);
      if (!target) {
        status = 404;
        data = { success: false, message: "Review not found." };
      } else {
        target.status = body?.status;
        data = { success: true, data: target };
      }
    } else if (method === "delete" && url.startsWith("/reviews/")) {
      const id = url.slice("/reviews/".length);
      reviews = reviews.filter((row) => row._id !== id);
      data = { success: true, data: { id } };
    } else {
      status = 404;
      data = { success: false, message: "Route not found." };
    }

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

function seedReviews(): Array<Record<string, unknown>> {
  return [
    {
      _id: "r1",
      name: "Alice",
      email: "alice@example.com",
      rating: 5,
      comment: "Wonderful work throughout the house.",
      status: "pending",
      createdAt: "2026-01-05T10:00:00.000Z",
    },
    {
      _id: "r2",
      name: "Bob",
      email: "bob@example.com",
      rating: 4,
      comment: "Very neat and tidy painters.",
      status: "approved",
      createdAt: "2026-01-04T10:00:00.000Z",
    },
    {
      _id: "r3",
      name: "Cara",
      email: "cara@example.com",
      rating: 3,
      comment: "The start was delayed a little.",
      status: "hidden",
      createdAt: "2026-01-03T10:00:00.000Z",
    },
  ];
}

function authenticate() {
  sessionStorage.setItem(AUTH_TOKEN_KEY, "admin-token");
  useAuthStore.setState({
    token: "admin-token",
    user: { id: "1", name: "Site Admin", email: "admin@example.com", role: "admin" },
    status: "authed",
    sessionNotice: null,
  });
}

describe("AdminReviewModerationPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthStore.getState().logout();
    reviews = seedReviews();
    recorded = [];
    installAdapter();
    authenticate();
  });

  it("loads pending reviews with the admin Bearer token", async () => {
    render(<AdminReviewModerationPage />);

    expect(await screen.findByText("Alice")).toBeTruthy();
    expect(screen.queryByText("Bob")).toBeNull();
    expect(screen.queryByText("Cara")).toBeNull();

    expect(recorded[0].url).toBe("/reviews/all");
    expect(recorded[0].statusParam).toBe("pending");
    expect(recorded[0].auth).toBe("Bearer admin-token");
  });

  it("approves a pending review", async () => {
    render(<AdminReviewModerationPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Approve review from Alice" }));

    await waitFor(() => {
      const patch = recorded.find((request) => request.method === "patch");
      expect(patch?.url).toBe("/reviews/r1");
      expect(patch?.body).toEqual({ status: "approved" });
      expect(patch?.auth).toBe("Bearer admin-token");
    });
    // The pending queue is refetched — Alice is no longer pending.
    await waitFor(() => expect(screen.queryByText("Alice")).toBeNull());
  });

  it("hides an approved review from the Approved tab", async () => {
    render(<AdminReviewModerationPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Approved" }));
    expect(await screen.findByText("Bob")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hide review from Bob" }));
    await waitFor(() => {
      const patch = recorded.find((request) => request.method === "patch");
      expect(patch?.url).toBe("/reviews/r2");
      expect(patch?.body).toEqual({ status: "hidden" });
    });
    await waitFor(() => expect(screen.queryByText("Bob")).toBeNull());
  });

  it("requeues a hidden review from the Hidden tab", async () => {
    render(<AdminReviewModerationPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Hidden" }));
    expect(await screen.findByText("Cara")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Requeue review from Cara" }));
    await waitFor(() => {
      const patch = recorded.find((request) => request.method === "patch");
      expect(patch?.url).toBe("/reviews/r3");
      expect(patch?.body).toEqual({ status: "pending" });
    });
  });

  it("deletes a review only after confirmation", async () => {
    render(<AdminReviewModerationPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Delete review from Alice" }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(recorded.filter((request) => request.method === "delete")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      const remove = recorded.find((request) => request.method === "delete");
      expect(remove?.url).toBe("/reviews/r1");
      expect(remove?.auth).toBe("Bearer admin-token");
    });
    await waitFor(() => expect(screen.queryByText("Alice")).toBeNull());
  });

  it("surfaces a 403 as a permission error without ending the session", async () => {
    api.defaults.adapter = (async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      const response = {
        data: { success: false, message: "You do not have permission to do that." },
        status: 403,
        statusText: "",
        headers: {},
        config,
      } as AxiosResponse;
      throw new AxiosError("Forbidden", "ERR_BAD_REQUEST", config, null, response);
    }) as typeof api.defaults.adapter;

    render(<AdminReviewModerationPage />);

    expect(await screen.findByText(/you do not have permission/i)).toBeTruthy();
    expect(useAuthStore.getState().status).toBe("authed");
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe("admin-token");
  });

  it("ends the session when an admin request returns 401", async () => {
    api.defaults.adapter = (async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      const response = {
        data: { success: false, message: "Session expired or token invalid." },
        status: 401,
        statusText: "",
        headers: {},
        config,
      } as AxiosResponse;
      throw new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, null, response);
    }) as typeof api.defaults.adapter;

    render(<AdminReviewModerationPage />);

    await waitFor(() => expect(useAuthStore.getState().status).toBe("guest"));
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });
});
