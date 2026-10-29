import { Router } from "express";
import {
  createGalleryItem,
  deleteGalleryItem,
  listAllGallery,
  listPublicGallery,
  updateGalleryItem,
} from "../controllers/gallery.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { galleryCreateSchema, galleryUpdateSchema } from "../validation/schemas.js";

export const galleryRouter = Router();

galleryRouter.get("/", listPublicGallery);

// Admin
galleryRouter.get("/all", requireAuth, requireRole("admin"), listAllGallery);
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
