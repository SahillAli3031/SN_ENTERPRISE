import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { fetchMe } from "../api/auth";
import { fetchAdminReviews } from "../api/reviews";
import { fetchAllGallery } from "../api/gallery";
import { fetchEnquiries } from "../api/enquiries";
import { AUTH_TOKEN_KEY, useAuthStore } from "../store/authStore";
import type { AuthUser } from "../types";

vi.mock("../api/auth", () => ({
  loginRequest: vi.fn(),
  fetchMe: vi.fn(),
}));
vi.mock("../api/reviews", () => ({
  fetchPublishedReviews: vi.fn().mockResolvedValue([]),
  submitReview: vi.fn(),
  fetchAdminReviews: vi.fn(),
  updateReviewStatus: vi.fn(),
  deleteReview: vi.fn(),
}));
vi.mock("../api/gallery", () => ({
  fetchGalleryItems: vi.fn().mockResolvedValue({ items: [], isDemo: false }),
  fetchAllGallery: vi.fn(),
  createGalleryItem: vi.fn(),
  updateGalleryItem: vi.fn(),
  deleteGalleryItem: vi.fn(),
}));
vi.mock("../api/enquiries", () => ({
  createEnquiry: vi.fn(),
  fetchEnquiries: vi.fn(),
  updateEnquiryStatus: vi.fn(),
  deleteEnquiry: vi.fn(),
}));

const admin: AuthUser = {
  id: "1",
  name: "Site Admin",
  email: "admin@example.com",
  role: "admin",
};

function axiosError(status: number): AxiosError {
  return new AxiosError(
    `Request failed with status code ${status}`,
    String(status),
    undefined,
    undefined,
    { status, statusText: "", data: { success: false, message: "Session expired or token invalid." }, headers: {}, config: {} } as never,
  );
}

describe("admin route guard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthStore.getState().logout();
    vi.mocked(fetchAdminReviews).mockResolvedValue([]);
    vi.mocked(fetchAllGallery).mockResolvedValue([]);
    vi.mocked(fetchEnquiries).mockResolvedValue([]);
  });

  it("redirects unauthenticated visitors from /admin to /admin/login", async () => {
    window.history.pushState({}, "", "/admin");
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe("/admin/login"));
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it("revalidates a stored session once and renders the admin dashboard", async () => {
    sessionStorage.setItem(AUTH_TOKEN_KEY, "stored-token");
    vi.mocked(fetchMe).mockResolvedValue(admin);
    window.history.pushState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: "Dashboard" })).toBeTruthy();
    expect(window.location.pathname).toBe("/admin");
    expect(fetchMe).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("navigation", { name: "Admin" })).toBeTruthy();
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe("stored-token");
  });

  it("shows the 403 view for signed-in non-admin accounts", async () => {
    sessionStorage.setItem(AUTH_TOKEN_KEY, "stored-token");
    vi.mocked(fetchMe).mockResolvedValue({ ...admin, role: "customer" });
    window.history.pushState({}, "", "/admin");
    render(<App />);

    expect(
      await screen.findByRole("heading", { level: 1, name: /administrator access only/i }),
    ).toBeTruthy();
    expect(window.location.pathname).toBe("/admin");
    expect(screen.queryByRole("heading", { level: 1, name: "Dashboard" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Admin" })).toBeNull();
  });

  it("clears an expired session when /auth/me returns 401", async () => {
    sessionStorage.setItem(AUTH_TOKEN_KEY, "expired-token");
    vi.mocked(fetchMe).mockRejectedValue(axiosError(401));
    window.history.pushState({}, "", "/admin");
    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe("/admin/login"));
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(useAuthStore.getState().status).toBe("guest");
    expect(await screen.findByText(/your session has expired/i)).toBeTruthy();
  });

  it("keeps the session when the session check hits a network error", async () => {
    sessionStorage.setItem(AUTH_TOKEN_KEY, "stored-token");
    vi.mocked(fetchMe).mockRejectedValue(
      new AxiosError("Network Error", "ERR_NETWORK", undefined, undefined, undefined),
    );
    window.history.pushState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: "Dashboard" })).toBeTruthy();
    expect(window.location.pathname).toBe("/admin");
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe("stored-token");
    expect(useAuthStore.getState().sessionNotice).toMatch(/couldn't verify your session/i);
    expect(screen.getByRole("status").textContent).toContain("couldn't verify your session");
  });

  it("keeps the session when /auth/me returns a server error", async () => {
    sessionStorage.setItem(AUTH_TOKEN_KEY, "stored-token");
    vi.mocked(fetchMe).mockRejectedValue(axiosError(500));
    window.history.pushState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: "Dashboard" })).toBeTruthy();
    expect(window.location.pathname).toBe("/admin");
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe("stored-token");
    expect(useAuthStore.getState().status).toBe("authed");
  });

  it("logs out from the admin header and returns to the login page", async () => {
    sessionStorage.setItem(AUTH_TOKEN_KEY, "stored-token");
    vi.mocked(fetchMe).mockResolvedValue(admin);
    window.history.pushState({}, "", "/admin");
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /log out/i }));
    await waitFor(() => expect(window.location.pathname).toBe("/admin/login"));
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(useAuthStore.getState().status).toBe("guest");
  });
});
