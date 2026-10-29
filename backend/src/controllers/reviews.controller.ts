import type { Request, Response } from "express";
import { Review, type ReviewStatus } from "../models/Review.js";
import type { ReviewCreateInput } from "../validation/schemas.js";

function serialize(review: {
  _id: unknown;
  name: string;
  email?: string;
  rating: number;
  comment: string;
  status: string;
  createdAt?: Date;
}) {
  return {
    id: String(review._id),
    name: review.name,
    // Email only appears in admin listings (the public query never selects it).
    ...(review.email ? { email: review.email } : {}),
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    createdAt: review.createdAt,
  };
}

/** GET /api/reviews — public: approved reviews only. */
export async function listPublicReviews(_req: Request, res: Response): Promise<void> {
  const reviews = await Review.find({ status: "approved" })
    .select("name rating comment createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  res.json({
    success: true,
    data: reviews.map(serialize),
    meta: { total: reviews.length, page: 1, limit: 200 },
  });
}

/** POST /api/reviews — public: stored as pending until approved. */
export async function createReview(req: Request, res: Response): Promise<void> {
  const payload = req.body as ReviewCreateInput;
  const review = await Review.create({ ...payload, status: "pending" });
  res.status(201).json({
    success: true,
    message: "Review received. It will appear once approved.",
    data: { id: review.id },
  });
}

/** GET /api/reviews/all — admin: every review regardless of status. */
export async function listAllReviews(req: Request, res: Response): Promise<void> {
  const status = req.query.status as ReviewStatus | undefined;
  const filter = status ? { status } : {};
  const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();
  res.json({
    success: true,
    data: reviews.map(serialize),
    meta: { total: reviews.length },
  });
}

/** PATCH /api/reviews/:id — admin: approve, hide or requeue. */
export async function updateReviewStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body as { status: ReviewStatus };
  const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!review) {
    res.status(404).json({ success: false, message: "Review not found." });
    return;
  }
  res.json({ success: true, data: serialize({ ...review.toObject(), _id: review._id }) });
}

/** DELETE /api/reviews/:id — admin. */
export async function deleteReview(req: Request, res: Response): Promise<void> {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) {
    res.status(404).json({ success: false, message: "Review not found." });
    return;
  }
  res.json({ success: true, data: { id: req.params.id } });
}
