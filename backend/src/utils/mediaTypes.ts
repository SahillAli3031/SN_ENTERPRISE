export type MediaKind = "image" | "video";

export interface MediaType {
  mime: string;
  kind: MediaKind;
  /** Canonical file extension without the leading dot. */
  extension: string;
}

export const IMAGE_MEDIA_TYPES: readonly MediaType[] = [
  { mime: "image/jpeg", kind: "image", extension: "jpg" },
  { mime: "image/png", kind: "image", extension: "png" },
  { mime: "image/webp", kind: "image", extension: "webp" },
  { mime: "image/gif", kind: "image", extension: "gif" },
  { mime: "image/avif", kind: "image", extension: "avif" },
];

export const VIDEO_MEDIA_TYPES: readonly MediaType[] = [
  { mime: "video/mp4", kind: "video", extension: "mp4" },
  { mime: "video/webm", kind: "video", extension: "webm" },
  { mime: "video/quicktime", kind: "video", extension: "mov" },
];

export const MEDIA_TYPES: readonly MediaType[] = [...IMAGE_MEDIA_TYPES, ...VIDEO_MEDIA_TYPES];

const BY_MIME = new Map(MEDIA_TYPES.map((type) => [type.mime, type]));

export const SUPPORTED_MIME_TYPES: ReadonlySet<string> = new Set(BY_MIME.keys());
export const IMAGE_MIME_TYPES: ReadonlySet<string> = new Set(
  IMAGE_MEDIA_TYPES.map((type) => type.mime),
);
export const VIDEO_MIME_TYPES: ReadonlySet<string> = new Set(
  VIDEO_MEDIA_TYPES.map((type) => type.mime),
);

/** Browsers occasionally send these instead of a concrete media type. */
const GENERIC_MIME_TYPES: ReadonlySet<string> = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
]);

const MIME_ALIASES: Readonly<Record<string, string>> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "video/x-m4v": "video/mp4",
};

/** Lower-cases, strips parameters (`; charset=…`) and resolves known aliases. */
export function normalizeMimeType(raw: string | undefined | null): string {
  const base = (raw ?? "").split(";")[0].trim().toLowerCase();
  return MIME_ALIASES[base] ?? base;
}

export function isGenericMimeType(raw: string | undefined | null): boolean {
  return GENERIC_MIME_TYPES.has(normalizeMimeType(raw));
}

export function getMediaType(mime: string): MediaType | undefined {
  return BY_MIME.get(normalizeMimeType(mime));
}

export function supportedMimeList(kind?: MediaKind): string {
  const types = kind === "image" ? IMAGE_MEDIA_TYPES : kind === "video" ? VIDEO_MEDIA_TYPES : MEDIA_TYPES;
  return types.map((type) => type.mime).join(", ");
}

function ascii(buffer: Buffer, start: number, end: number): string {
  return buffer.subarray(start, end).toString("latin1");
}

/** ISO-BMFF brands that identify HEIC/HEIF still images (not supported). */
const HEIF_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"]);
const AVIF_BRANDS = new Set(["avif", "avis"]);
const QUICKTIME_BRANDS = new Set(["qt  ", "qtvr"]);

/**
 * Identifies a media type from the leading bytes of the file (magic numbers /
 * container brands) rather than trusting the client-provided name or
 * `Content-Type`. Returns `null` when the bytes are not a supported format.
 */
export function detectMediaType(header: Buffer): MediaType | null {
  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return getMediaType("image/jpeg") ?? null;
  }
  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    ascii(header, 1, 4) === "PNG" &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a
  ) {
    return getMediaType("image/png") ?? null;
  }
  if (header.length >= 6) {
    const signature = ascii(header, 0, 6);
    if (signature === "GIF87a" || signature === "GIF89a") return getMediaType("image/gif") ?? null;
  }
  if (header.length >= 12 && ascii(header, 0, 4) === "RIFF" && ascii(header, 8, 12) === "WEBP") {
    return getMediaType("image/webp") ?? null;
  }
  if (header.length >= 4 && header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3) {
    return getMediaType("video/webm") ?? null;
  }
  // ISO base media file format (MP4 / MOV / AVIF / HEIC): "size" + "ftyp".
  if (header.length >= 12 && ascii(header, 4, 8) === "ftyp") {
    const boxSize = header.readUInt32BE(0);
    const brandEnd = Math.min(boxSize >= 8 ? boxSize : header.length, header.length);
    let sawAvif = false;
    let sawQuicktime = false;
    let sawHeif = false;
    for (let offset = 8; offset + 4 <= brandEnd; offset += 4) {
      const brand = ascii(header, offset, offset + 4);
      if (AVIF_BRANDS.has(brand)) sawAvif = true;
      else if (QUICKTIME_BRANDS.has(brand)) sawQuicktime = true;
      else if (HEIF_BRANDS.has(brand)) sawHeif = true;
    }
    if (sawAvif) return getMediaType("image/avif") ?? null;
    if (sawQuicktime) return getMediaType("video/quicktime") ?? null;
    if (sawHeif) return null; // HEIC/HEIF is not in the supported list.
    return getMediaType("video/mp4") ?? null;
  }
  return null;
}
