import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "./error.js";
import {
  SUPPORTED_MIME_TYPES,
  detectMediaType,
  getMediaType,
  isGenericMimeType,
  normalizeMimeType,
  supportedMimeList,
  type MediaKind,
} from "../utils/mediaTypes.js";
import {
  commitTempFile,
  ensureUploadDirs,
  readHeader,
  removeTempFile,
  tempDir,
} from "../utils/uploadStorage.js";

/** Result of a validated upload, attached to the request by `validateUpload`. */
export interface StoredUpload {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  type: MediaKind;
}

declare global {
  namespace Express {
    interface Request {
      upload?: StoredUpload;
      /** Path of the temp file currently being streamed (cleared on success). */
      uploadTempPath?: string;
    }
  }
}

/** Hard ceiling accepted by the multipart parser (per-kind limits apply after). */
export const MAX_UPLOAD_BYTES = Math.max(env.UPLOAD_MAX_IMAGE_BYTES, env.UPLOAD_MAX_VIDEO_BYTES);

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const megabytes = bytes / (1024 * 1024);
    return `${megabytes >= 10 || Number.isInteger(megabytes) ? Math.round(megabytes) : megabytes.toFixed(1)} MB`;
  }
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} bytes`;
}

const receiveFile = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      ensureUploadDirs()
        .then(() => callback(null, tempDir()))
        .catch((error: unknown) => callback(error as Error, tempDir()));
    },
    // Client names are never trusted — temp files get a random server-side name.
    filename: (req, _file, callback) => {
      const fileName = `${randomUUID()}.part`;
      req.uploadTempPath = path.join(tempDir(), fileName);
      callback(null, fileName);
    },
  }),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    fields: 8,
    fieldSize: 4 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const declared = normalizeMimeType(file.mimetype);
    if (isGenericMimeType(declared) || SUPPORTED_MIME_TYPES.has(declared)) {
      callback(null, true);
      return;
    }
    callback(
      new ApiError(415, `Unsupported file type "${declared}". Supported types: ${supportedMimeList()}.`),
    );
  },
}).single("file");

function toUploadError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return new ApiError(
          413,
          `The file is too large. Images must be ${formatBytes(env.UPLOAD_MAX_IMAGE_BYTES)} or smaller and videos must be ${formatBytes(env.UPLOAD_MAX_VIDEO_BYTES)} or smaller.`,
        );
      case "LIMIT_FILE_COUNT":
      case "LIMIT_UNEXPECTED_FILE":
        return new ApiError(400, 'Send exactly one file in a form field named "file".');
      case "LIMIT_FIELD_COUNT":
      case "LIMIT_FIELD_VALUE":
        return new ApiError(400, "The upload contained too many or oversized form fields.");
      default:
        return new ApiError(400, "The upload could not be read. Please try again.");
    }
  }
  const message = error instanceof Error ? error.message : "";
  if (/unexpected end of (form|file)|missing boundary|unsupported content type/i.test(message)) {
    return new ApiError(400, "The upload was interrupted or is malformed. Please try again.");
  }
  return new ApiError(500, "The file could not be saved. Please try again.");
}

/**
 * Multipart receiver. Rejects non-multipart requests up front, then streams the
 * single `file` field into the temp directory and maps parser errors to safe,
 * actionable API errors while cleaning up partial files.
 */
export const receiveMediaUpload: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.is("multipart/form-data")) {
    next(
      new ApiError(
        415,
        'Send the upload as multipart/form-data with a file field named "file".',
      ),
    );
    return;
  }

  receiveFile(req, res, (error) => {
    void (async () => {
      if (error) {
        await Promise.all([removeTempFile(req.file?.path), removeTempFile(req.uploadTempPath)]);
        next(toUploadError(error));
        return;
      }
      next();
    })();
  });
};

/**
 * Verifies the received file: real signature (never the name alone), declared
 * type consistency, requested media kind and per-kind size limit. On success the
 * temp file is moved to its final, server-named location and `req.upload` is set.
 */
export const validateUpload: RequestHandler = async (req, _res, next) => {
  const tempPath = req.file?.path ?? req.uploadTempPath;
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file was received. Attach one file in a form field named "file".');
    }

    const detected = detectMediaType(await readHeader(req.file.path));
    if (!detected) {
      throw new ApiError(
        415,
        `That file is not a supported image or video. Supported types: ${supportedMimeList()}.`,
      );
    }

    const declared = normalizeMimeType(req.file.mimetype);
    if (!isGenericMimeType(declared)) {
      const declaredType = getMediaType(declared);
      if (!declaredType) {
        throw new ApiError(415, `Unsupported file type "${declared}". Supported types: ${supportedMimeList()}.`);
      }
      if (declaredType.mime !== detected.mime) {
        throw new ApiError(
          415,
          `The file contents (${detected.mime}) do not match the declared type (${declaredType.mime}).`,
        );
      }
    }

    const requested = typeof req.body?.type === "string" ? req.body.type : undefined;
    if (requested !== undefined && requested !== "image" && requested !== "video") {
      throw new ApiError(422, "Media type must be image or video.");
    }
    if (requested && requested !== detected.kind) {
      throw new ApiError(
        415,
        `You selected ${requested}, but that file is a ${detected.kind} (${detected.mime}).`,
      );
    }

    const limit =
      detected.kind === "image" ? env.UPLOAD_MAX_IMAGE_BYTES : env.UPLOAD_MAX_VIDEO_BYTES;
    if (req.file.size > limit) {
      throw new ApiError(
        413,
        `The file is ${formatBytes(req.file.size)}. ${detected.kind === "image" ? "Images" : "Videos"} must be ${formatBytes(limit)} or smaller.`,
      );
    }

    const stored = await commitTempFile(req.file.path, detected);
    req.upload = {
      url: stored.url,
      fileName: stored.fileName,
      mimeType: detected.mime,
      size: stored.size,
      type: detected.kind,
    };
    req.uploadTempPath = undefined;
    next();
  } catch (error) {
    await removeTempFile(tempPath);
    next(error instanceof ApiError ? error : new ApiError(500, "The upload failed. Please try again."));
  }
};
