import type { LucideIcon } from "lucide-react";

export type GalleryCategory = "interior" | "exterior" | "commercial";

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  image: string;
}

export interface TrustItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface WhyChooseItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  type: "image" | "video";
  imageUrl: string;
  videoUrl?: string;
  alt: string;
  published: boolean;
  createdAt?: string;
  /** true when served from bundled demo content instead of the API. */
  isDemo?: boolean;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewPayload {
  name: string;
  email: string;
  rating: number;
  comment: string;
}

export interface EnquiryPayload {
  fullName: string;
  phone: string;
  email: string;
  serviceType: string;
  propertyType: string;
  message: string;
}

export type UserRole = "admin" | "customer";

/** User object returned by the auth endpoints (never trust this client-side for authorization). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Exact success shape of POST /api/auth/login. */
export interface AuthSession {
  token: string;
  user: AuthUser;
}

export type ReviewStatus = "pending" | "approved" | "hidden";

export type EnquiryStatus = "new" | "contacted" | "closed";

/** Row returned by GET /api/reviews/all — admin listings include email and status. */
export interface AdminReview {
  id: string;
  name: string;
  email?: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
}

/** Row returned by GET /api/enquiries (admin only). */
export interface Enquiry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  serviceType: string;
  propertyType: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}

/**
 * Envelope for admin list endpoints — unlike `ApiListEnvelope`, only `total`
 * is guaranteed inside `meta` (the public endpoints also send page/limit).
 */
export interface AdminListEnvelope<T> {
  success: boolean;
  data: T[];
  meta?: { total?: number };
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface ApiListEnvelope<T> {
  success: boolean;
  data: T[];
  meta?: { total: number; page: number; limit: number };
}
