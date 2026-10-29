import type { Request, Response } from "express";
import { GalleryItem, type GalleryCategory } from "../models/GalleryItem.js";
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
  const item = await GalleryItem.findByIdAndUpdate(
    req.params.id,
    { ...(updates.videoUrl === "" ? { videoUrl: undefined } : updates) },
    { new: true, runValidators: true },
  );
  if (!item) {
    res.status(404).json({ success: false, message: "Gallery item not found." });
    return;
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
  res.json({ success: true, data: { id: req.params.id } });
}
