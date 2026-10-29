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

/** POST /api/gallery — admin: creates an item from an image URL (no file upload exists). */
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
