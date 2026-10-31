import { Schema, model, type HydratedDocument } from "mongoose";

export type ReviewStatus = "pending" | "approved" | "hidden";

export interface ReviewAttrs {
  name: string;
  email: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
}

export type ReviewDoc = HydratedDocument<ReviewAttrs>;

const reviewSchema = new Schema<ReviewAttrs>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "hidden"],
      default: "approved",
      index: true,
    },
  },
  { timestamps: true },
);

reviewSchema.index({ status: 1, createdAt: -1 });

export const Review = model<ReviewAttrs>("Review", reviewSchema);
