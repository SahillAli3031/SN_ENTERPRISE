/**
 * Client-side mirror of the API upload policy.
 *
 * The limits below must match `backend/src/config/env.ts`
 * (`UPLOAD_MAX_IMAGE_BYTES` / `UPLOAD_MAX_VIDEO_BYTES`); the server remains
 * the authority and always re-validates size, MIME type and file signature.
 */

export type MediaKind = "image" | "video";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

/** `accept` values for the file input — also how mobile browsers filter pickers. */
export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(",");
export const VIDEO_ACCEPT = VIDEO_MIME_TYPES.join(",");

/** Sent when a browser does not report a concrete media type for the file. */
const GENERIC_MIME_TYPES = ["", "application/octet-stream", "binary/octet-stream"];

export function acceptFor(type: MediaKind): string {
  return type === "video" ? VIDEO_ACCEPT : IMAGE_ACCEPT;
}

export function maxBytesFor(type: MediaKind): number {
  return type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const megabytes = bytes / (1024 * 1024);
    return `${megabytes >= 10 || Number.isInteger(megabytes) ? Math.round(megabytes) : megabytes.toFixed(1)} MB`;
  }
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} bytes`;
}

/**
 * Quick client-side check so the user gets instant feedback. The API repeats
 * every check server-side (including real file-signature inspection).
 */
export function validateMediaFile(file: File, type: MediaKind): string | null {
  const limit = maxBytesFor(type);
  if (file.size === 0) return "That file is empty. Please choose a different file.";
  if (file.size > limit) {
    return `“${file.name}” is ${formatBytes(file.size)}. ${
      type === "image" ? "Images" : "Videos"
    } must be ${formatBytes(limit)} or smaller.`;
  }

  const declared = (file.type || "").split(";")[0].trim().toLowerCase();
  if (GENERIC_MIME_TYPES.includes(declared)) return null; // server verifies the signature

  const allowed: readonly string[] = type === "video" ? VIDEO_MIME_TYPES : IMAGE_MIME_TYPES;
  if (allowed.includes(declared)) return null;

  return type === "video"
    ? `“${file.name}” is ${declared}, which is not a supported video. Use MP4, WebM or MOV.`
    : `“${file.name}” is ${declared}, which is not a supported image. Use JPEG, PNG, WebP, GIF or AVIF.`;
}
