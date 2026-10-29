import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../api/client";
import { AdminGalleryPage } from "../pages/admin/AdminGalleryPage";
import { AdminEnquiriesPage } from "../pages/admin/AdminEnquiriesPage";
import { AUTH_TOKEN_KEY, useAuthStore } from "../store/authStore";

interface RecordedRequest {
  url: string;
  method: string;
  auth: string | null;
  body?: Record<string, unknown>;
}

let gallery: Array<Record<string, unknown>>;
let enquiries: Array<Record<string, unknown>>;
let recorded: RecordedRequest[];
let nextId: number;

function installAdapter(): void {
  api.defaults.adapter = (async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const method = (config.method ?? "get").toLowerCase();
    const url = config.url ?? "";
    const body =
      typeof config.data === "string" ? (JSON.parse(config.data) as Record<string, unknown>) : undefined;
    const auth = ((config.headers.get("Authorization") as string | null | undefined) ?? null);
    recorded.push({ url, method, auth, body });

    let status = 200;
    let data: unknown = { success: true, data: [] };
    const id = url.includes("/") ? url.slice(url.lastIndexOf("/") + 1) : "";

    if (method === "get" && url === "/gallery/all") {
      data = { success: true, data: [...gallery], meta: { total: gallery.length } };
    } else if (method === "post" && url === "/gallery") {
      const created = { _id: `g${nextId++}`, ...body };
      gallery.push(created);
      data = { success: true, data: created };
    } else if (method === "patch" && url.startsWith("/gallery/")) {
      const target = gallery.find((row) => row._id === id);
      if (!target) {
        status = 404;
        data = { success: false, message: "Gallery item not found." };
      } else {
        Object.assign(target, body);
        data = { success: true, data: target };
      }
    } else if (method === "delete" && url.startsWith("/gallery/")) {
      gallery = gallery.filter((row) => row._id !== id);
      data = { success: true, data: { id } };
    } else if (method === "get" && url === "/enquiries") {
      data = { success: true, data: [...enquiries], meta: { total: enquiries.length } };
    } else if (method === "patch" && url.startsWith("/enquiries/")) {
      const target = enquiries.find((row) => row._id === id);
      if (!target) {
        status = 404;
        data = { success: false, message: "Enquiry not found." };
      } else {
        Object.assign(target, body);
        data = { success: true, data: target };
      }
    } else if (method === "delete" && url.startsWith("/enquiries/")) {
      enquiries = enquiries.filter((row) => row._id !== id);
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

function authenticate() {
  sessionStorage.setItem(AUTH_TOKEN_KEY, "admin-token");
  useAuthStore.setState({
    token: "admin-token",
    user: { id: "1", name: "Site Admin", email: "admin@example.com", role: "admin" },
    status: "authed",
    sessionNotice: null,
  });
}

describe("admin gallery management", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthStore.getState().logout();
    gallery = [
      {
        _id: "g1",
        title: "Sunny kitchen",
        category: "interior",
        type: "image",
        imageUrl: "https://images.example/kitchen.jpg",
        alt: "Bright kitchen after repaint",
        published: true,
        createdAt: "2026-01-02T10:00:00.000Z",
      },
    ];
    recorded = [];
    nextId = 100;
    installAdapter();
    authenticate();
  });

  it("creates a gallery item from an image URL", async () => {
    render(<AdminGalleryPage />);
    fireEvent.click(await screen.findByRole("button", { name: /add image/i }));

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Hallway refresh" } });
    fireEvent.change(screen.getByLabelText("Image URL"), {
      target: { value: "https://images.example/hall.jpg" },
    });
    fireEvent.change(screen.getByLabelText("Alt text"), {
      target: { value: "Freshly painted hallway" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to gallery" }));

    await waitFor(() => {
      const post = recorded.find((request) => request.method === "post");
      expect(post?.url).toBe("/gallery");
      expect(post?.auth).toBe("Bearer admin-token");
      expect(post?.body).toMatchObject({
        title: "Hallway refresh",
        category: "interior",
        type: "image",
        imageUrl: "https://images.example/hall.jpg",
        alt: "Freshly painted hallway",
        published: true,
      });
    });
    expect(await screen.findByText("Hallway refresh")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("edits an existing gallery item", async () => {
    render(<AdminGalleryPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit Sunny kitchen" }));

    const titleInput = screen.getByLabelText("Title") as HTMLInputElement;
    expect(titleInput.value).toBe("Sunny kitchen");
    fireEvent.change(titleInput, { target: { value: "Sunny kitchen refresh" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      const patch = recorded.find((request) => request.method === "patch");
      expect(patch?.url).toBe("/gallery/g1");
      expect(patch?.auth).toBe("Bearer admin-token");
      expect(patch?.body).toMatchObject({ title: "Sunny kitchen refresh" });
    });
    expect(await screen.findByText("Sunny kitchen refresh")).toBeTruthy();
  });

  it("unpublishes and republishes a gallery item", async () => {
    render(<AdminGalleryPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Unpublish Sunny kitchen" }));

    await waitFor(() => {
      const patch = recorded.find((request) => request.method === "patch");
      expect(patch?.url).toBe("/gallery/g1");
      expect(patch?.body).toMatchObject({ published: false });
    });
    expect(await screen.findByRole("button", { name: "Publish Sunny kitchen" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Publish Sunny kitchen" }));
    await waitFor(() => {
      const patches = recorded.filter((request) => request.method === "patch");
      expect(patches[patches.length - 1].body).toMatchObject({ published: true });
    });
  });

  it("deletes a gallery item after confirmation", async () => {
    render(<AdminGalleryPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Delete Sunny kitchen" }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(recorded.filter((request) => request.method === "delete")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      const remove = recorded.find((request) => request.method === "delete");
      expect(remove?.url).toBe("/gallery/g1");
      expect(remove?.auth).toBe("Bearer admin-token");
    });
    expect(await screen.findByText(/no gallery items yet/i)).toBeTruthy();
  });
});

describe("admin enquiries management", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthStore.getState().logout();
    enquiries = [
      {
        _id: "e1",
        fullName: "Alice Cooper",
        phone: "+15550001",
        email: "alice@example.com",
        serviceType: "Interior painting",
        propertyType: "Apartment",
        message: "Please quote our living room.",
        status: "new",
        createdAt: "2026-01-06T10:00:00.000Z",
      },
    ];
    recorded = [];
    nextId = 100;
    installAdapter();
    authenticate();
  });

  it("loads enquiries and updates a follow-up status", async () => {
    render(<AdminEnquiriesPage />);
    const select = (await screen.findByLabelText("Status for Alice Cooper")) as HTMLSelectElement;
    expect(select.value).toBe("new");

    fireEvent.change(select, { target: { value: "contacted" } });
    await waitFor(() => {
      const patch = recorded.find((request) => request.method === "patch");
      expect(patch?.url).toBe("/enquiries/e1");
      expect(patch?.body).toEqual({ status: "contacted" });
      expect(patch?.auth).toBe("Bearer admin-token");
    });
    await waitFor(() =>
      expect((screen.getByLabelText("Status for Alice Cooper") as HTMLSelectElement).value).toBe(
        "contacted",
      ),
    );
  });

  it("deletes an enquiry after confirmation", async () => {
    render(<AdminEnquiriesPage />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete enquiry from Alice Cooper" }),
    );

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(recorded.filter((request) => request.method === "delete")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      const remove = recorded.find((request) => request.method === "delete");
      expect(remove?.url).toBe("/enquiries/e1");
      expect(remove?.auth).toBe("Bearer admin-token");
    });
    expect(await screen.findByText(/no enquiries yet/i)).toBeTruthy();
  });
});
