import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../App";

/**
 * Render smoke tests: catch runtime errors (bad imports, invalid hook usage,
 * framer-motion misuse) across the routes without a browser.
 */

const routes: Array<{ path: string; expect: RegExp }> = [
  { path: "/", expect: /beautiful spaces begin with the right paint/i },
  { path: "/about", expect: /a painting company built on preparation/i },
  { path: "/services", expect: /painting services for interiors/i },
  { path: "/work", expect: /a portfolio of spaces/i },
  { path: "/reviews", expect: /feedback from the people/i },
  { path: "/contact", expect: /let's plan your painting project/i },
  { path: "/privacy", expect: /privacy policy/i },
  { path: "/terms", expect: /terms & conditions/i },
  { path: "/admin/login", expect: /administrator sign in/i },
  { path: "/does-not-exist", expect: /painted over/i },
];

describe("app routes render", () => {
  it.each(routes)("renders %s", async ({ path, expect: text }) => {
    window.history.pushState({}, "", path);
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByRole("heading", { level: 1, name: text }).length).toBeGreaterThan(0);
    });
  });

  it("shows the brand and primary navigation", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getAllByLabelText(/Verdant & Co\. Painters — home/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /get a free quote/i }).length).toBeGreaterThan(0);
  });

  it("keeps the WhatsApp button hidden until a real number is configured", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.queryByLabelText(/chat with us on whatsapp/i)).toBeNull();
  });

  it("does not throw while gallery and reviews data loads", async () => {
    window.history.pushState({}, "", "/work");
    const errorSpy = vi.spyOn(console, "error");
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText(/Sample project photography/i).length).toBeGreaterThan(0);
    });
    const realErrors = errorSpy.mock.calls.filter((args) =>
      String(args[0] ?? "").includes("Warning:"),
    );
    expect(realErrors).toEqual([]);
    errorSpy.mockRestore();
  });
});
