import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { fetchMe, loginRequest } from "../api/auth";
import { fetchAdminReviews } from "../api/reviews";
import { fetchAllGallery } from "../api/gallery";
import { fetchEnquiries } from "../api/enquiries";
import { AUTH_TOKEN_KEY, useAuthStore } from "../store/authStore";
import type { AuthSession } from "../types";

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

const adminSession: AuthSession = {
  token: "fresh-token",
  user: { id: "1", name: "Site Admin", email: "admin@example.com", role: "admin" },
};

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
}

describe("AdminLoginPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthStore.getState().logout();
    vi.mocked(fetchAdminReviews).mockResolvedValue([]);
    vi.mocked(fetchAllGallery).mockResolvedValue([]);
    vi.mocked(fetchEnquiries).mockResolvedValue([]);
    window.history.pushState({}, "", "/admin/login");
  });

  it("renders without the public navigation or footer", async () => {
    render(<App />);
    expect(
      await screen.findByRole("heading", { level: 1, name: /administrator sign in/i }),
    ).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: /primary/i })).toBeNull();
    expect(screen.queryByRole("contentinfo")).toBeNull();
    expect(screen.getByRole("link", { name: /back to the website/i })).toBeTruthy();
  });

  it("shows validation errors without calling the API when the form is empty", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Sign In" }));
    expect(await screen.findByText("Please enter a valid email address.")).toBeTruthy();
    expect(await screen.findByText("Password is required.")).toBeTruthy();
    expect(loginRequest).not.toHaveBeenCalled();
  });

  it("surfaces invalid credentials without storing a token", async () => {
    vi.mocked(loginRequest).mockRejectedValueOnce(new Error("Email or password is incorrect."));
    render(<App />);
    fillAndSubmit("admin@example.com", "wrong-password");
    expect((await screen.findByRole("alert")).textContent).toContain("Email or password is incorrect.");
    expect(window.location.pathname).toBe("/admin/login");
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(useAuthStore.getState().status).toBe("guest");
  });

  it("disables the submit button while signing in, then opens the dashboard", async () => {
    let resolveLogin: ((session: AuthSession) => void) | undefined;
    vi.mocked(loginRequest).mockImplementation(
      () => new Promise<AuthSession>((resolve) => { resolveLogin = resolve; }),
    );
    render(<App />);
    fillAndSubmit("admin@example.com", "correct-password");

    await waitFor(() => {
      expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    });
    expect(screen.getByRole("button").textContent).toContain("Signing in…");

    resolveLogin?.(adminSession);

    await waitFor(() => expect(window.location.pathname).toBe("/admin"));
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe("fresh-token");
    expect(useAuthStore.getState().status).toBe("authed");
    expect(await screen.findByRole("heading", { level: 1, name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Admin" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: /primary/i })).toBeNull();
    // The fresh login response is authoritative — no extra session check.
    expect(fetchMe).not.toHaveBeenCalled();
  });
});
