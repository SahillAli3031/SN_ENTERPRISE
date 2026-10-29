import { api, getErrorMessage } from "./client";
import { demoGallery } from "../config/images";
import type {
  AdminListEnvelope,
  ApiEnvelope,
  ApiListEnvelope,
  GalleryCategory,
  GalleryItem,
} from "../types";

interface RawGalleryItem {
  _id?: string;
  id?: string;
  title?: string;
  category?: string;
  type?: string;
  imageUrl?: string;
  videoUrl?: string;
  alt?: string;
  published?: boolean;
  createdAt?: string;
}

function mapItem(raw: RawGalleryItem): GalleryItem {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    title: raw.title ?? "Untitled project",
    category: (raw.category as GalleryCategory) ?? "interior",
    type: raw.type === "video" ? "video" : "image",
    imageUrl: raw.imageUrl ?? "",
    videoUrl: raw.videoUrl,
    alt: raw.alt ?? raw.title ?? "Painting project photograph",
    published: raw.published ?? true,
    createdAt: raw.createdAt,
  };
}

function demoItems(category: GalleryCategory | "all", limit?: number): GalleryItem[] {
  const items = demoGallery
    .filter((item) => category === "all" || item.category === category)
    .map((item, index) => ({
      id: `demo-${index + 1}`,
      title: item.title,
      category: item.category,
      type: "image" as const,
      imageUrl: item.imageUrl,
      alt: item.alt,
      published: true,
      isDemo: true,
    }));
  return typeof limit === "number" ? items.slice(0, limit) : items;
}

export interface GalleryResult {
  items: GalleryItem[];
  /** true when the API could not be reached and demo content is being shown. */
  isDemo: boolean;
}

/**
 * Loads published gallery items. Falls back to the bundled demo portfolio when
 * the API is unavailable so the page still renders during local development.
 */
export async function fetchGalleryItems(
  category: GalleryCategory | "all" = "all",
  limit?: number,
): Promise<GalleryResult> {
  try {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (typeof limit === "number") params.set("limit", String(limit));
    const query = params.toString();
    const { data } = await api.get<ApiListEnvelope<RawGalleryItem>>(
      `/gallery${query ? `?${query}` : ""}`,
    );
    const items = (data.data ?? []).map(mapItem).filter((item) => item.published);
    if (items.length === 0 && category !== "all") {
      return { items: demoItems(category, limit), isDemo: true };
    }
    return { items, isDemo: false };
  } catch {
    return { items: demoItems(category, limit), isDemo: true };
  }
}

/** GET /api/gallery/all — admin: every item, including unpublished ones. */
export async function fetchAllGallery(): Promise<GalleryItem[]> {
  try {
    const { data } = await api.get<AdminListEnvelope<RawGalleryItem>>("/gallery/all", {
      requiresAuth: true,
    });
    return (data.data ?? []).map(mapItem);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load the gallery."));
  }
}

/**
 * POST /api/gallery — admin: creates an item from media URLs. Files chosen on
 * the device are uploaded first with `uploadGalleryMedia`, whose URL is then
 * saved here.
 */
export async function createGalleryItem(payload: Partial<GalleryItem>): Promise<GalleryItem> {
  try {
    const { data } = await api.post<ApiEnvelope<RawGalleryItem>>("/gallery", payload, {
      requiresAuth: true,
    });
    return mapItem(data.data ?? {});
  } catch (error) {
    throw new Error(getErrorMessage(error, "The gallery item could not be created."));
  }
}

/** PATCH /api/gallery/:id — admin: edit fields or publish/unpublish an item. */
export async function updateGalleryItem(
  id: string,
  payload: Partial<GalleryItem>,
): Promise<GalleryItem> {
  try {
    const { data } = await api.patch<ApiEnvelope<RawGalleryItem>>(`/gallery/${id}`, payload, {
      requiresAuth: true,
    });
    return mapItem(data.data ?? {});
  } catch (error) {
    throw new Error(getErrorMessage(error, "The gallery item could not be updated."));
  }
}

/** DELETE /api/gallery/:id — admin. */
export async function deleteGalleryItem(id: string): Promise<void> {
  try {
    await api.delete(`/gallery/${id}`, { requiresAuth: true });
  } catch (error) {
    throw new Error(getErrorMessage(error, "The gallery item could not be deleted."));
  }
}

/** Media stored by `POST /api/gallery/upload` — its URL feeds the normal create/update flow. */
export interface UploadedMedia {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  type: "image" | "video";
}

/**
 * POST /api/gallery/upload — admin: sends one image/video file as
 * `multipart/form-data` and returns the stored public URL. `onUploadProgress`
 * receives 0–100 when the browser reports progress.
 */
export async function uploadGalleryMedia(
  file: File,
  type: "image" | "video",
  onUploadProgress?: (percent: number) => void,
): Promise<UploadedMedia> {
  try {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file, file.name);
    const { data } = await api.post<ApiEnvelope<UploadedMedia>>("/gallery/upload", formData, {
      requiresAuth: true,
      // Overrides the JSON default so the browser can add the multipart boundary.
      headers: { "Content-Type": "multipart/form-data" },
      // Large videos must outlive the shared 15s client timeout.
      timeout: 0,
      onUploadProgress: (event) => {
        if (!onUploadProgress || !event.total) return;
        onUploadProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    });
    return data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "The file could not be uploaded."));
  }
}
