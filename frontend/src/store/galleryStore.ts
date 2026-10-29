import { create } from "zustand";
import { fetchGalleryItems } from "../api/gallery";
import type { GalleryCategory, GalleryItem } from "../types";

export type GalleryFilter = GalleryCategory | "all";
export type GalleryStatus = "idle" | "loading" | "success" | "error";

interface GalleryState {
  items: GalleryItem[];
  filter: GalleryFilter;
  status: GalleryStatus;
  isDemo: boolean;
  /** Optional cap on how many items are loaded (used on the homepage). */
  limit?: number;
  /** Index of the item shown in the lightbox, or null when closed. */
  lightboxIndex: number | null;
  load: (filter?: GalleryFilter, limit?: number) => Promise<void>;
  setFilter: (filter: GalleryFilter) => void;
  openLightbox: (index: number) => void;
  closeLightbox: () => void;
  showNext: () => void;
  showPrev: () => void;
}

/**
 * Shared gallery state: filtering and lightbox navigation are used by both the
 * grid and the lightbox overlay, so they live in a single store.
 */
export const useGalleryStore = create<GalleryState>((set, get) => ({
  items: [],
  filter: "all",
  status: "idle",
  isDemo: false,
  limit: undefined,
  lightboxIndex: null,

  load: async (filter = get().filter, limit = get().limit) => {
    set({ status: "loading", filter, limit });
    try {
      const { items, isDemo } = await fetchGalleryItems(filter, limit);
      set({ items, isDemo, status: "success", lightboxIndex: null });
    } catch {
      set({ status: "error", items: [] });
    }
  },

  setFilter: (filter) => {
    void get().load(filter, get().limit);
  },

  openLightbox: (index) => set({ lightboxIndex: index }),
  closeLightbox: () => set({ lightboxIndex: null }),

  showNext: () => {
    const { items, lightboxIndex } = get();
    if (lightboxIndex === null || items.length === 0) return;
    set({ lightboxIndex: (lightboxIndex + 1) % items.length });
  },

  showPrev: () => {
    const { items, lightboxIndex } = get();
    if (lightboxIndex === null || items.length === 0) return;
    set({ lightboxIndex: (lightboxIndex - 1 + items.length) % items.length });
  },
}));
