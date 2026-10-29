import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectMediaType,
  getMediaType,
  normalizeMimeType,
  supportedMimeList,
} from "../utils/mediaTypes.js";

function media(header: number[] | string, totalBytes = 64): Buffer {
  const bytes = typeof header === "string" ? Buffer.from(header, "latin1") : Buffer.from(header);
  const buffer = Buffer.alloc(totalBytes);
  bytes.copy(buffer);
  return buffer;
}

/** size (4 bytes) + brand string, as used by ISO base media files. */
function isoFile(brand: string, compatible: string[] = []): Buffer {
  const brands = [brand, ...compatible];
  const size = 8 + brands.length * 4;
  const buffer = Buffer.alloc(Math.max(size, 64));
  buffer.writeUInt32BE(size, 0);
  buffer.write("ftyp", 4, "latin1");
  brands.forEach((value, index) => buffer.write(value, 8 + index * 4, "latin1"));
  return buffer;
}

describe("media type detection", () => {
  it("detects images from their magic numbers", () => {
    assert.equal(detectMediaType(media([0xff, 0xd8, 0xff, 0xe0]))?.mime, "image/jpeg");
    assert.equal(
      detectMediaType(media([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime,
      "image/png",
    );
    assert.equal(detectMediaType(media("GIF89a...."))?.mime, "image/gif");
    assert.equal(detectMediaType(media("RIFF....WEBP"))?.mime, "image/webp");
    assert.equal(detectMediaType(isoFile("avif", ["mif1"]))?.mime, "image/avif");
  });

  it("detects videos from their container signatures", () => {
    assert.equal(detectMediaType(isoFile("isom", ["iso2", "avc1"]))?.mime, "video/mp4");
    assert.equal(detectMediaType(isoFile("qt  "))?.mime, "video/quicktime");
    assert.equal(detectMediaType(media([0x1a, 0x45, 0xdf, 0xa3, 0x01]))?.mime, "video/webm");
  });

  it("returns null for unsupported or unreadable bytes", () => {
    assert.equal(detectMediaType(Buffer.alloc(0)), null);
    assert.equal(detectMediaType(media("just some plain text bytes")), null);
    assert.equal(detectMediaType(media("%PDF-1.7\n%âãÏÓ")), null);
    // HEIC/HEIF shares the ISO container but is not on the supported list.
    assert.equal(detectMediaType(isoFile("heic", ["mif1"])), null);
  });

  it("normalizes browser MIME aliases", () => {
    assert.equal(normalizeMimeType("IMAGE/JPG; charset=binary"), "image/jpeg");
    assert.equal(normalizeMimeType("image/pjpeg"), "image/jpeg");
    assert.equal(normalizeMimeType("image/x-png"), "image/png");
    assert.equal(normalizeMimeType(undefined), "");
  });

  it("maps MIME types to their canonical entry and lists support", () => {
    assert.equal(getMediaType("image/jpeg")?.kind, "image");
    assert.equal(getMediaType("video/webm")?.kind, "video");
    assert.equal(getMediaType("application/pdf"), undefined);
    const all = supportedMimeList();
    assert.ok(all.includes("image/jpeg") && all.includes("video/mp4"));
    assert.ok(supportedMimeList("image").includes("image/png"));
    assert.ok(!supportedMimeList("image").includes("video/mp4"));
    assert.ok(supportedMimeList("video").includes("video/webm"));
  });
});
