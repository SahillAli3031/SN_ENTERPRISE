import type { Request, Response } from "express";
import { GalleryItem, type GalleryCategory } from "../models/GalleryItem.js";
import { deleteStoredUpload, isUploadUrl } from "../utils/uploadStorage.js";
import type { GalleryCreateInput } from "../validation/schemas.js";

function serialize(item: {
  _id: unknown;
  title: string;
  category: string;
  type: string;
  imageUrl: string;
  videoUrl?: string;
  alt: string;
  published: boolean;
  createdAt?: Date;
}) {
  return {
    id: String(item._id),
    title: item.title,
    category: item.category,
    type: item.type,
    imageUrl: item.imageUrl,
    videoUrl: item.videoUrl,
    alt: item.alt,
    published: item.published,
    createdAt: item.createdAt,
  };
}

/**
 * Deletes a locally stored upload once no gallery record references it any
 * more. Remote (http/https) URLs are never touched.
 */
async function removeUnreferencedUploads(urls: Array<string | undefined>): Promise<void> {
  for (const url of new Set(urls)) {
    if (!url || !isUploadUrl(url)) continue;
    try {
      const references = await GalleryItem.countDocuments({
        $or: [{ imageUrl: url }, { videoUrl: url }],
      });
      if (references === 0) await deleteStoredUpload(url);
    } catch (error) {
      console.error(
        "⚠️ Could not remove stored upload:",
        error instanceof Error ? error.message : error,
      );
    }
  }
}

/**
 * POST /api/gallery/upload — admin: stores a validated multipart file and
 * returns its public URL for use with the normal gallery create/update flow.
 */
export async function uploadGalleryMedia(req: Request, res: Response): Promise<void> {
  if (!req.upload) {
    res.status(500).json({ success: false, message: "The file could not be saved. Please try again." });
    return;
  }
  res.status(201).json({ success: true, data: req.upload });
}

/** GET /api/gallery — public: published items, optional ?category and ?limit. */
export async function listPublicGallery(req: Request, res: Response): Promise<void> {
  const category = req.query.category as GalleryCategory | undefined;
  const rawLimit = Number(req.query.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 100;

  const filter: Record<string, unknown> = { published: true };
  if (category && ["interior", "exterior", "commercial"].includes(category)) {
    filter.category = category;
  }

  const items = await GalleryItem.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({
    success: true,
    data: items.map(serialize),
    meta: { total: items.length, page: 1, limit },
  });
}

/** GET /api/gallery/all — admin: includes unpublished items. */
export async function listAllGallery(_req: Request, res: Response): Promise<void> {
  const items = await GalleryItem.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: items.map(serialize) });
}

/** POST /api/gallery — admin. */
export async function createGalleryItem(req: Request, res: Response): Promise<void> {
  const payload = req.body as GalleryCreateInput;
  const item = await GalleryItem.create({
    ...payload,
    videoUrl: payload.videoUrl || undefined,
  });
  res.status(201).json({ success: true, data: serialize({ ...item.toObject(), _id: item._id }) });
}

/** PATCH /api/gallery/:id — admin: edit, publish or unpublish. */
export async function updateGalleryItem(req: Request, res: Response): Promise<void> {
  const updates = req.body as Partial<GalleryCreateInput>;
  const touchesMedia = updates.imageUrl !== undefined || updates.videoUrl !== undefined;
  const previous = touchesMedia ? await GalleryItem.findById(req.params.id).lean() : null;

  const item = await GalleryItem.findByIdAndUpdate(
    req.params.id,
    { ...(updates.videoUrl === "" ? { videoUrl: undefined } : updates) },
    { new: true, runValidators: true },
  );
  if (!item) {
    res.status(404).json({ success: false, message: "Gallery item not found." });
    return;
  }

  if (previous) {
    const nextImageUrl = updates.imageUrl !== undefined ? updates.imageUrl : previous.imageUrl;
    const rawVideoUrl = updates.videoUrl !== undefined ? updates.videoUrl : previous.videoUrl;
    const nextVideoUrl = rawVideoUrl === "" ? undefined : rawVideoUrl;
    await removeUnreferencedUploads([
      previous.imageUrl && previous.imageUrl !== nextImageUrl ? previous.imageUrl : undefined,
      previous.videoUrl && previous.videoUrl !== nextVideoUrl ? previous.videoUrl : undefined,
    ]);
  }

  res.json({ success: true, data: serialize({ ...item.toObject(), _id: item._id }) });
}

/** DELETE /api/gallery/:id — admin. */
export async function deleteGalleryItem(req: Request, res: Response): Promise<void> {
  const item = await GalleryItem.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404).json({ success: false, message: "Gallery item not found." });
    return;
  }
  await removeUnreferencedUploads([item.imageUrl, item.videoUrl]);
  res.json({ success: true, data: { id: req.params.id } });
}
