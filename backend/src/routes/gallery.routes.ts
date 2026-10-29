import { Router } from "express";
import {
  createGalleryItem,
  deleteGalleryItem,
  listAllGallery,
  listPublicGallery,
  updateGalleryItem,
  uploadGalleryMedia,
} from "../controllers/gallery.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { receiveMediaUpload, validateUpload } from "../middleware/upload.js";
import { validateBody } from "../middleware/validate.js";
import { galleryCreateSchema, galleryUpdateSchema } from "../validation/schemas.js";

export const galleryRouter = Router();

galleryRouter.get("/", listPublicGallery);

// Admin
galleryRouter.get("/all", requireAuth, requireRole("admin"), listAllGallery);
galleryRouter.post(
  "/upload",
  requireAuth,
  requireRole("admin"),
  receiveMediaUpload,
  validateUpload,
  uploadGalleryMedia,
);
galleryRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validateBody(galleryCreateSchema),
  createGalleryItem,
);
galleryRouter.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validateBody(galleryUpdateSchema),
  updateGalleryItem,
);
galleryRouter.delete("/:id", requireAuth, requireRole("admin"), deleteGalleryItem);
