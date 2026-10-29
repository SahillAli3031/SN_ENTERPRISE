import { fireEvent, render, screen } from "@testing-library/react";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../api/client";
import { GallerySection } from "../sections/GallerySection";
import { useGalleryStore } from "../store/galleryStore";

const RAW_VIDEO_ITEM = {
  _id: "video-1",
  title: "Timelapse repaint",
  category: "interior",
  type: "video",
  imageUrl: "/uploads/1-thumb.png",
  videoUrl: "/uploads/1-timelapse.mp4",
  alt: "Timelapse of a living room being repainted",
  published: true,
};

const RAW_IMAGE_ITEM = {
  _id: "image-1",
  title: "Uploaded kitchen",
  category: "interior",
  type: "image",
  imageUrl: "/uploads/2-kitchen.png",
  alt: "Freshly painted white kitchen",
  published: true,
};

function installAdapter(items: Array<Record<string, unknown>>): void {
  api.defaults.adapter = (async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const ok: AxiosResponse = {
      data: { success: true, data: items, meta: { total: items.length } },
      status: 200,
      statusText: "",
      headers: {},
      config,
    } as AxiosResponse;
    if ((config.method ?? "get").toLowerCase() === "get" && config.url?.startsWith("/gallery")) {
      return ok;
    }
    throw new AxiosError(
      "Route not found.",
      "404",
      config,
      null,
      { ...ok, status: 404, data: { success: false, message: "Route not found." } },
    );
  });
}

describe("public gallery media rendering", () => {
  beforeEach(() => {
    useGalleryStore.setState({
      items: [],
      filter: "all",
      status: "idle",
      isDemo: false,
      limit: undefined,
      lightboxIndex: null,
    });
  });

  it("renders an uploaded video file from the API in the grid", async () => {
    installAdapter([RAW_VIDEO_ITEM]);
    const { container } = render(<GallerySection showBeforeAfter={false} />);

    const video = (await screen.findByLabelText(
      "Timelapse of a living room being repainted",
    )) as HTMLVideoElement;
    expect(video.tagName).toBe("VIDEO");
    expect(video.getAttribute("src")).toBe("/uploads/1-timelapse.mp4");
    expect(video.getAttribute("preload")).toBe("metadata");
    expect(video.hasAttribute("controls")).toBe(false);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Timelapse repaint")).toBeTruthy();
  });

  it("opens the uploaded video with playback controls in the lightbox", async () => {
    installAdapter([RAW_VIDEO_ITEM]);
    render(<GallerySection showBeforeAfter={false} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Open Timelapse repaint in full screen" }),
    );

    const lightboxVideo = document.querySelector("video[controls]") as HTMLVideoElement | null;
    expect(lightboxVideo).toBeTruthy();
    expect(lightboxVideo!.getAttribute("src")).toBe("/uploads/1-timelapse.mp4");
  });

  it("renders an uploaded image file from the API without a video element", async () => {
    installAdapter([RAW_IMAGE_ITEM]);
    const { container } = render(<GallerySection showBeforeAfter={false} />);

    const image = (await screen.findByAltText("Freshly painted white kitchen")) as HTMLImageElement;
    expect(image.tagName).toBe("IMG");
    expect(image.getAttribute("src")).toBe("/uploads/2-kitchen.png");
    expect(container.querySelector("video")).toBeNull();
    expect(useGalleryStore.getState().isDemo).toBe(false);
  });
});
