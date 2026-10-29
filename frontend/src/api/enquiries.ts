import { api, getErrorMessage } from "./client";
import type { AdminListEnvelope, ApiEnvelope, Enquiry, EnquiryPayload, EnquiryStatus } from "../types";

function mapEnquiry(raw: Record<string, unknown>): Enquiry {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    fullName: String(raw.fullName ?? ""),
    phone: String(raw.phone ?? ""),
    email: String(raw.email ?? ""),
    serviceType: String(raw.serviceType ?? ""),
    propertyType: String(raw.propertyType ?? ""),
    message: String(raw.message ?? ""),
    status: (raw.status as EnquiryStatus) ?? "new",
    createdAt: String(raw.createdAt ?? ""),
  };
}

/**
 * Sends a quote/contact enquiry to the Express API, which validates and stores
 * it in MongoDB for the admin dashboard.
 */
export async function createEnquiry(payload: EnquiryPayload): Promise<void> {
  try {
    await api.post<ApiEnvelope<unknown>>("/enquiries", payload);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Your enquiry could not be sent. Please try again."));
  }
}

/** GET /api/enquiries — admin only. */
export async function fetchEnquiries(): Promise<Enquiry[]> {
  try {
    const { data } = await api.get<AdminListEnvelope<Record<string, unknown>>>("/enquiries", {
      requiresAuth: true,
    });
    return (data.data ?? []).map(mapEnquiry);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load enquiries."));
  }
}

/** PATCH /api/enquiries/:id — admin: changes the follow-up status. */
export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<Enquiry> {
  try {
    const { data } = await api.patch<ApiEnvelope<Record<string, unknown>>>(
      `/enquiries/${id}`,
      { status },
      { requiresAuth: true },
    );
    return mapEnquiry(data.data ?? {});
  } catch (error) {
    throw new Error(getErrorMessage(error, "That change could not be saved."));
  }
}

/** DELETE /api/enquiries/:id — admin. */
export async function deleteEnquiry(id: string): Promise<void> {
  try {
    await api.delete(`/enquiries/${id}`, { requiresAuth: true });
  } catch (error) {
    throw new Error(getErrorMessage(error, "The enquiry could not be deleted."));
  }
}
