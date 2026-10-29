import { Schema, model, type HydratedDocument } from "mongoose";

export type GalleryCategory = "interior" | "exterior" | "commercial";
export type GalleryType = "image" | "video";

export interface GalleryItemAttrs {
  title: string;
  category: GalleryCategory;
  type: GalleryType;
  imageUrl: string;
  videoUrl?: string;
  alt: string;
  published: boolean;
}

export type GalleryItemDoc = HydratedDocument<GalleryItemAttrs>;

const galleryItemSchema = new Schema<GalleryItemAttrs>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["interior", "exterior", "commercial"],
      required: true,
      index: true,
    },
    type: { type: String, enum: ["image", "video"], default: "image" },
    imageUrl: { type: String, required: true },
    videoUrl: { type: String },
    alt: { type: String, required: true, trim: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

galleryItemSchema.index({ published: 1, category: 1, createdAt: -1 });

export const GalleryItem = model<GalleryItemAttrs>("GalleryItem", galleryItemSchema);
