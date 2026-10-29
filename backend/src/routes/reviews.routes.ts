import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createReview,
  deleteReview,
  listAllReviews,
  listPublicReviews,
  updateReviewStatus,
} from "../controllers/reviews.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { reviewCreateSchema, reviewStatusSchema } from "../validation/schemas.js";

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many reviews submitted. Please try again later." },
});

export const reviewsRouter = Router();

reviewsRouter.get("/", listPublicReviews);
reviewsRouter.post("/", submitLimiter, validateBody(reviewCreateSchema), createReview);

// Admin
reviewsRouter.get("/all", requireAuth, requireRole("admin"), listAllReviews);
reviewsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validateBody(reviewStatusSchema),
  updateReviewStatus,
);
reviewsRouter.delete("/:id", requireAuth, requireRole("admin"), deleteReview);
