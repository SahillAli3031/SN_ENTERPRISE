import { api, getErrorMessage } from "./client";
import type {
  AdminListEnvelope,
  AdminReview,
  ApiEnvelope,
  ApiListEnvelope,
  Review,
  ReviewPayload,
  ReviewStatus,
} from "../types";

function mapReview(raw: Record<string, unknown>): Review {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    name: String(raw.name ?? ""),
    rating: Number(raw.rating ?? 0),
    comment: String(raw.comment ?? ""),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function mapAdminReview(raw: Record<string, unknown>): AdminReview {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    name: String(raw.name ?? ""),
    email: raw.email ? String(raw.email) : undefined,
    rating: Number(raw.rating ?? 0),
    comment: String(raw.comment ?? ""),
    status: (raw.status as ReviewStatus) ?? "pending",
    createdAt: String(raw.createdAt ?? ""),
  };
}

/** Only approved/published reviews are ever returned by the public endpoint. */
export async function fetchPublishedReviews(): Promise<Review[]> {
  try {
    const { data } = await api.get<ApiListEnvelope<Record<string, unknown>>>("/reviews");
    return (data.data ?? []).map(mapReview);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load reviews."));
  }
}

/** Submits a review for moderation. Rejects when the API call fails. */
export async function submitReview(payload: ReviewPayload): Promise<void> {
  try {
    await api.post<ApiEnvelope<unknown>>("/reviews", payload);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Your review could not be sent. Please try again."));
  }
}

/** GET /api/reviews/all — admin only. Optional filter: pending, approved or hidden. */
export async function fetchAdminReviews(status?: ReviewStatus): Promise<AdminReview[]> {
  try {
    const { data } = await api.get<AdminListEnvelope<Record<string, unknown>>>("/reviews/all", {
      requiresAuth: true,
      ...(status ? { params: { status } } : {}),
    });
    return (data.data ?? []).map(mapAdminReview);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load reviews."));
  }
}

/** PATCH /api/reviews/:id — admin: approve, hide or requeue a review. */
export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<AdminReview> {
  try {
    const { data } = await api.patch<ApiEnvelope<Record<string, unknown>>>(
      `/reviews/${id}`,
      { status },
      { requiresAuth: true },
    );
    return mapAdminReview(data.data ?? {});
  } catch (error) {
    throw new Error(getErrorMessage(error, "That change could not be saved."));
  }
}

/** DELETE /api/reviews/:id — admin: permanently removes the review. */
export async function deleteReview(id: string): Promise<void> {
  try {
    await api.delete(`/reviews/${id}`, { requiresAuth: true });
  } catch (error) {
    throw new Error(getErrorMessage(error, "The review could not be deleted."));
  }
}
