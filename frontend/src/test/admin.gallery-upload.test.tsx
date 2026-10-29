import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../api/client";
import { IMAGE_ACCEPT, VIDEO_ACCEPT } from "../config/uploads";
import { AdminGalleryPage } from "../pages/admin/AdminGalleryPage";
import { AUTH_TOKEN_KEY, useAuthStore } from "../store/authStore";

interface RecordedRequest {
  url: string;
  method: string;
  auth: string | null;
  formData?: FormData;
  body?: Record<string, unknown>;
}

const STORED_URL = "/uploads/1700000000000-abc123def456.png";

let gallery: Array<Record<string, unknown>>;
let recorded: RecordedRequest[];
let uploadHold: { release: () => void } | null;
let uploadError: { status: number; message: string } | null;

function installAdapter(): void {
  api.defaults.adapter = (async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const method = (config.method ?? "get").toLowerCase();
    const url = config.url ?? "";
    const auth = ((config.headers.get("Authorization") as string | null | undefined) ?? null);
    const formData = config.data instanceof FormData ? config.data : undefined;
    const body =
      typeof config.data === "string" ? (JSON.parse(config.data) as Record<string, unknown>) : undefined;
    recorded.push({ url, method, auth, formData, body });

    let status = 200;
    let data: unknown = { success: true, data: [] };

    if (method === "get" && url === "/gallery/all") {
      data = { success: true, data: [...gallery], meta: { total: gallery.length } };
    } else if (method === "post" && url === "/gallery/upload") {
      config.onUploadProgress?.({ loaded: 40, total: 100, bytes: 40, lengthComputable: true });
      if (uploadHold) {
        await new Promise<void>((resolve) => {
          uploadHold!.release = resolve;
        });
      }
      if (uploadError) {
        status = uploadError.status;
        data = { success: false, message: uploadError.message };
      } else {
        const file = formData?.get("file") as File | null;
        config.onUploadProgress?.({ loaded: 100, total: 100, bytes: 100, lengthComputable: true });
        data = {
          success: true,
          data: {
            url: STORED_URL,
            fileName: "1700000000000-abc123def456.png",
            mimeType: file?.type ?? "image/png",
            size: file?.size ?? 0,
            type: String(formData?.get("type") ?? "image"),
          },
        };
      }
    } else if (method === "post" && url === "/gallery") {
      const created = { _id: `g${gallery.length + 100}`, ...body };
      gallery.push(created);
      data = { success: true, data: created };
    } else if (method === "patch" && url.startsWith("/gallery/")) {
      const target = gallery.find((row) => row._id === url.slice(url.lastIndexOf("/") + 1));
      if (target) Object.assign(target, body);
      data = { success: true, data: target ?? {} };
    } else if (method === "delete" && url.startsWith("/gallery/")) {
      data = { success: true, data: { id: url.slice(url.lastIndexOf("/") + 1) } };
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

function authenticate(): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, "admin-token");
  useAuthStore.setState({
    token: "admin-token",
    user: { id: "1", name: "Site Admin", email: "admin@example.com", role: "admin" },
    status: "authed",
    sessionNotice: null,
  });
}

function chooseFile(file: File): void {
  const input = screen.getByLabelText(/choose a file/i) as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  fireEvent.change(input);
}

function fillDetails(): void {
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Uploaded project" } });
  fireEvent.change(screen.getByLabelText("Alt text"), {
    target: { value: "Freshly painted room after upload" },
  });
}

async function openDeviceModal(): Promise<void> {
  render(<AdminGalleryPage />);
  fireEvent.click(await screen.findByRole("button", { name: /add image or video/i }));
  fireEvent.click(screen.getByRole("radio", { name: "Upload from device" }));
}

describe("admin gallery device uploads", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthStore.getState().logout();
    gallery = [];
    recorded = [];
    uploadHold = null;
    uploadError = null;
    installAdapter();
    authenticate();
  });

  it("offers both input methods and keeps URL entry as the default", async () => {
    render(<AdminGalleryPage />);
    fireEvent.click(await screen.findByRole("button", { name: /add image or video/i }));

    expect(screen.getByLabelText("Image URL")).toBeTruthy();
    expect(screen.queryByLabelText(/choose a file/i)).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "Upload from device" }));
    expect(screen.getByLabelText(/choose a file/i)).toBeTruthy();
    expect(screen.queryByLabelText("Image URL")).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "Enter URL" }));
    expect(screen.getByLabelText("Image URL")).toBeTruthy();
    expect(screen.queryByLabelText(/choose a file/i)).toBeNull();
  });

  it("filters the file picker by the selected media type", async () => {
    await openDeviceModal();
    expect(screen.getByLabelText(/choose a file/i).getAttribute("accept")).toBe(IMAGE_ACCEPT);

    fireEvent.change(screen.getByLabelText("Media type"), { target: { value: "video" } });
    expect(screen.getByLabelText(/choose a file/i).getAttribute("accept")).toBe(VIDEO_ACCEPT);
  });

  it("rejects an unsupported file before anything is uploaded", async () => {
    await openDeviceModal();
    fillDetails();
    chooseFile(new File(["%PDF-1.4"], "quote.pdf", { type: "application/pdf" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/not a supported image/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Add to gallery" }));
    await waitFor(() => expect(recorded.filter((r) => r.url === "/gallery/upload")).toHaveLength(0));
    expect(recorded.filter((r) => r.url === "/gallery")).toHaveLength(0);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("rejects a file larger than the image limit before uploading", async () => {
    await openDeviceModal();
    fillDetails();
    const oversized = new File([new Uint8Array(11 * 1024 * 1024)], "huge.png", {
      type: "image/png",
    });
    chooseFile(oversized);

    expect(await screen.findByText(/Images must be 10 MB or smaller/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add to gallery" }));
    expect(recorded.filter((r) => r.url === "/gallery/upload")).toHaveLength(0);
  });

  it("shows the selected file, its size and upload progress, then saves the returned URL", async () => {
    uploadHold = { release: () => undefined };
    await openDeviceModal();
    fillDetails();
    chooseFile(new File([new Uint8Array(2048)], "kitchen.png", { type: "image/png" }));

    expect(await screen.findByText("kitchen.png")).toBeTruthy();
    expect(screen.getByText("2 KB")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Add to gallery" }));

    const progressbar = await screen.findByRole("progressbar");
    expect(progressbar.getAttribute("aria-valuenow")).toBe("40");
    expect((screen.getByRole("button", { name: "Uploading 40%" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("progressbar").getAttribute("aria-label")).toBe("Upload progress");

    uploadHold.release();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const create = recorded.find((r) => r.method === "post" && r.url === "/gallery");
    expect(create?.auth).toBe("Bearer admin-token");
    expect(create?.body).toMatchObject({
      title: "Uploaded project",
      type: "image",
      imageUrl: STORED_URL,
      videoUrl: "",
      published: true,
    });
    const upload = recorded.find((r) => r.url === "/gallery/upload");
    expect(upload?.auth).toBe("Bearer admin-token");
    expect(upload?.formData?.get("type")).toBe("image");
    expect((upload?.formData?.get("file") as File).name).toBe("kitchen.png");
    expect(await screen.findByText(/Gallery item added to the gallery/i)).toBeTruthy();
    expect(await screen.findByText("Uploaded project")).toBeTruthy();
  });

  it("drops duplicate submissions while an upload is running", async () => {
    uploadHold = { release: () => undefined };
    await openDeviceModal();
    fillDetails();
    chooseFile(new File([new Uint8Array(64)], "one.png", { type: "image/png" }));

    const submit = screen.getByRole("button", { name: "Add to gallery" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() =>
      expect(recorded.filter((r) => r.url === "/gallery/upload").length).toBeGreaterThanOrEqual(1),
    );
    uploadHold.release();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    expect(recorded.filter((r) => r.url === "/gallery/upload")).toHaveLength(1);
    expect(recorded.filter((r) => r.method === "post" && r.url === "/gallery")).toHaveLength(1);
  });

  it("surfaces an upload error from the API and keeps the dialog open", async () => {
    uploadError = { status: 413, message: "Images must be 2 KB or smaller." };
    await openDeviceModal();
    fillDetails();
    chooseFile(new File([new Uint8Array(512)], "large.png", { type: "image/png" }));

    fireEvent.click(screen.getByRole("button", { name: "Add to gallery" }));

    expect(await screen.findByText("Images must be 2 KB or smaller.")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(recorded.filter((r) => r.method === "post" && r.url === "/gallery")).toHaveLength(0);
    expect((screen.getByRole("button", { name: "Add to gallery" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("uploads a video file and stores it as both media URLs", async () => {
    await openDeviceModal();
    fireEvent.change(screen.getByLabelText("Media type"), { target: { value: "video" } });
    fillDetails();
    chooseFile(new File([new Uint8Array(128)], "timelapse.mp4", { type: "video/mp4" }));

    expect(await screen.findByText("timelapse.mp4")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add to gallery" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const upload = recorded.find((r) => r.url === "/gallery/upload");
    expect(upload?.formData?.get("type")).toBe("video");
    const create = recorded.find((r) => r.method === "post" && r.url === "/gallery");
    expect(create?.body).toMatchObject({
      type: "video",
      imageUrl: STORED_URL,
      videoUrl: STORED_URL,
    });
  });

  it("keeps the existing media when editing without selecting a new file", async () => {
    gallery = [
      {
        _id: "g1",
        title: "Existing project",
        category: "interior",
        type: "image",
        imageUrl: "https://images.example.com/existing.jpg",
        alt: "Existing gallery photograph",
        published: true,
      },
    ];
    render(<AdminGalleryPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit Existing project" }));
    fireEvent.click(screen.getByRole("radio", { name: "Upload from device" }));

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Existing project v2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(recorded.filter((r) => r.url === "/gallery/upload")).toHaveLength(0);
    const patch = recorded.find((r) => r.method === "patch");
    expect(patch?.body).toMatchObject({
      title: "Existing project v2",
      imageUrl: "https://images.example.com/existing.jpg",
    });
  });
});
