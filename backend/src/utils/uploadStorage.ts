import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import type { MediaType } from "./mediaTypes.js";

/** Route the API serves stored uploads from (registered in `app.ts`). */
export const UPLOADS_ROUTE = "/uploads";

/** Public URL prefix for a stored file (see `app.ts`). */
export const UPLOAD_URL_PREFIX = `${UPLOADS_ROUTE}/`;

/** Temporary staging directory for in-flight uploads (inside the upload root). */
const TEMP_DIR_NAME = ".tmp";

let cachedRoot: string | null = null;

function root(): string {
  if (!cachedRoot) {
    cachedRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
  }
  return cachedRoot;
}

/** Absolute path of the directory that stores uploaded media. */
export function uploadRoot(): string {
  return root();
}

export function tempDir(): string {
  return path.join(root(), TEMP_DIR_NAME);
}

/** Creates the upload root and temp directory (idempotent). */
export async function ensureUploadDirs(): Promise<void> {
  await fs.mkdir(tempDir(), { recursive: true });
}

/**
 * Builds the public URL for a stored file. Only server-generated file names
 * reach this function — the client's original name/path is never used.
 */
export function uploadUrlFor(fileName: string): string {
  return `${UPLOAD_URL_PREFIX}${fileName}`;
}

/** True when the value is a path this server serves from its upload directory. */
export function isUploadUrl(url: string | undefined | null): boolean {
  if (typeof url !== "string") return false;
  if (!url.startsWith(UPLOAD_URL_PREFIX)) return false;
  return toStoredPath(url) !== null;
}

/**
 * Resolves an upload URL to an absolute path, or `null` when the URL does not
 * point at a plain file inside the upload root. Anything that could escape the
 * root (separators, `..`, dotfiles, nested paths) is rejected.
 */
export function toStoredPath(url: string): string | null {
  const name = url.slice(UPLOAD_URL_PREFIX.length);
  if (!name || name.includes("/") || name.includes("\\") || name.startsWith(".")) return null;
  if (name !== path.basename(name) || name.includes("..")) return null;
  const resolved = path.resolve(root(), name);
  if (resolved !== path.join(root(), name)) return null;
  return resolved;
}

/**
 * Atomically moves a validated temp file into its final location using a
 * server-generated, collision-resistant name. Falls back to copy + unlink when
 * the temp directory lives on another volume. Removes the temp file on failure.
 */
export async function commitTempFile(
  tempPath: string,
  mediaType: MediaType,
): Promise<{ fileName: string; size: number; url: string }> {
  const fileName = `${Date.now()}-${randomUUID().replace(/-/g, "")}.${mediaType.extension}`;
  const destination = path.join(root(), fileName);
  try {
    await fs.rename(tempPath, destination);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EXDEV") {
      await fs.rm(destination, { force: true }).catch(() => undefined);
      throw error;
    }
    try {
      await fs.copyFile(tempPath, destination);
    } catch (copyError) {
      await fs.rm(destination, { force: true }).catch(() => undefined);
      throw copyError;
    }
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
  }
  const stats = await fs.stat(destination);
  return { fileName, size: stats.size, url: uploadUrlFor(fileName) };
}

/** Best-effort removal of an in-flight upload (partial/aborted requests). */
export async function removeTempFile(tempPath: string | undefined): Promise<void> {
  if (!tempPath) return;
  try {
    await fs.rm(tempPath, { force: true });
  } catch {
    /* never mask the original error */
  }
}

/**
 * Deletes a stored upload. Callers must have already verified that no gallery
 * record references the URL; this only ever touches files inside the root that
 * match the generated name pattern (`<timestamp>-<hex>.<ext>`).
 */
export async function deleteStoredUpload(url: string): Promise<boolean> {
  const storedPath = isUploadUrl(url) ? toStoredPath(url) : null;
  if (!storedPath) return false;
  if (!/^\d+-[0-9a-f]{16,}\.[0-9a-z]+$/.test(path.basename(storedPath))) return false;
  try {
    await fs.rm(storedPath, { force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes temp files left behind by a crashed process. Called once at boot.
 */
export async function cleanupStaleTempFiles(maxAgeMs = 60 * 60 * 1000): Promise<void> {
  try {
    const dirents = await fs.readdir(tempDir(), { withFileTypes: true });
    const cutoff = Date.now() - maxAgeMs;
    await Promise.all(
      dirents.map(async (dirent) => {
        if (!dirent.isFile()) return;
        const filePath = path.join(tempDir(), dirent.name);
        const stats = await fs.stat(filePath).catch(() => null);
        if (stats && stats.mtimeMs < cutoff) await fs.rm(filePath, { force: true });
      }),
    );
  } catch {
    /* the directory may not exist yet */
  }
}

/** Reads the leading bytes of a temp file for signature inspection. */
export async function readHeader(filePath: string, bytes = 64): Promise<Buffer> {
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buffer, 0, bytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}
