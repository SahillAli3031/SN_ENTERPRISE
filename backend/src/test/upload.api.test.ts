import "./testEnv.js";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { app } from "../app.js";
import { signToken } from "../utils/jwt.js";
import { tempDir, uploadRoot } from "../utils/uploadStorage.js";
import { TEST_UPLOAD_DIR } from "./testEnv.js";

/** A real 1×1 PNG (valid signature, ~70 bytes). */
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
const WEBM_HEADER = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00, 0x00, 0x00]);

interface UploadResult {
  status: number;
  body: { success?: boolean; message?: string; data?: Record<string, unknown> };
}

let server: Server;
let baseUrl: string;
const adminToken = signToken({ sub: "test-admin", role: "admin" });
const customerToken = signToken({ sub: "test-customer", role: "customer" });

async function postUpload(
  bytes: Buffer,
  fileName: string,
  mimeType: string,
  options: { token?: string | null; type?: string } = {},
): Promise<UploadResult> {
  const form = new FormData();
  if (options.type) form.append("type", options.type);
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mimeType }), fileName);
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const response = await fetch(`${baseUrl}/api/gallery/upload`, {
    method: "POST",
    headers,
    body: form,
  });
  return { status: response.status, body: (await response.json()) as UploadResult["body"] };
}

async function listUploadDir(): Promise<string[]> {
  const entries = await fs.readdir(uploadRoot()).catch(() => [] as string[]);
  return entries.filter((entry) => entry !== ".tmp");
}

async function listTempFiles(): Promise<string[]> {
  return fs.readdir(tempDir()).catch(() => []);
}

describe("POST /api/gallery/upload", () => {
  before(async () => {
    await fs.rm(path.resolve(process.cwd(), TEST_UPLOAD_DIR), { recursive: true, force: true });
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await fs.rm(path.resolve(process.cwd(), TEST_UPLOAD_DIR), { recursive: true, force: true });
  });

  it("rejects uploads without a token", async () => {
    const { status, body } = await postUpload(PNG_1PX, "photo.png", "image/png");
    assert.equal(status, 401);
    assert.equal(body.success, false);
    assert.deepEqual(await listTempFiles(), []);
  });

  it("rejects uploads from a non-admin role", async () => {
    const { status, body } = await postUpload(PNG_1PX, "photo.png", "image/png", {
      token: customerToken,
    });
    assert.equal(status, 403);
    assert.equal(body.success, false);
    assert.deepEqual(await listTempFiles(), []);
  });

  it("rejects requests that are not multipart/form-data", async () => {
    const response = await fetch(`${baseUrl}/api/gallery/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ file: "nope" }),
    });
    assert.equal(response.status, 415);
    const body = (await response.json()) as { message?: string };
    assert.match(String(body.message), /multipart\/form-data/i);
  });

  it("rejects a file whose real contents are not a media file", async () => {
    const { status, body } = await postUpload(
      Buffer.from("This is plain text pretending to be an image."),
      "holiday.jpg",
      "image/jpeg",
      { token: adminToken, type: "image" },
    );
    assert.equal(status, 415);
    assert.match(String(body.message), /not a supported image or video/i);
    assert.match(String(body.message), /image\/jpeg/);
    assert.deepEqual(await listTempFiles(), [], "rejected uploads must not leave temp files");
    assert.deepEqual(await listUploadDir(), [], "rejected uploads must not be stored");
  });

  it("rejects a file that does not match the requested media type", async () => {
    const { status, body } = await postUpload(PNG_1PX, "photo.png", "image/png", {
      token: adminToken,
      type: "video",
    });
    assert.equal(status, 415);
    assert.match(String(body.message), /selected video.*file is a image/i);
    assert.deepEqual(await listUploadDir(), []);
  });

  it("rejects a file whose contents contradict the declared type", async () => {
    const { status, body } = await postUpload(JPEG_HEADER, "photo.png", "image/png", {
      token: adminToken,
      type: "image",
    });
    assert.equal(status, 415);
    assert.match(String(body.message), /do not match the declared type/i);
    assert.deepEqual(await listUploadDir(), []);
  });

  it("rejects an image above the configured image limit", async () => {
    const oversized = Buffer.concat([PNG_1PX, Buffer.alloc(3000, 0x42)]);
    const { status, body } = await postUpload(oversized, "big.png", "image/png", {
      token: adminToken,
      type: "image",
    });
    assert.equal(status, 413);
    assert.match(String(body.message), /Images must be 2 KB or smaller/i);
    assert.deepEqual(await listUploadDir(), []);
    assert.deepEqual(await listTempFiles(), []);
  });

  it("rejects a file above the multipart hard limit", async () => {
    const huge = Buffer.concat([PNG_1PX, Buffer.alloc(8000, 0x43)]);
    const { status, body } = await postUpload(huge, "huge.png", "image/png", {
      token: adminToken,
      type: "image",
    });
    assert.equal(status, 413);
    assert.match(String(body.message), /too large/i);
    assert.deepEqual(await listUploadDir(), []);
  });

  it("stores a valid image under a server-generated safe name", async () => {
    const { status, body } = await postUpload(PNG_1PX, "../../evil name.png", "image/png", {
      token: adminToken,
      type: "image",
    });
    assert.equal(status, 201);
    const data = body.data as Record<string, unknown>;
    const url = String(data.url);
    assert.match(url, /^\/uploads\/\d+-[0-9a-f]{16,}\.png$/);
    assert.equal(data.type, "image");
    assert.equal(data.mimeType, "image/png");
    assert.equal(data.size, PNG_1PX.length);
    const fileName = String(data.fileName);
    assert.ok(!fileName.includes("..") && !fileName.includes("/") && !fileName.includes("\\"));
    assert.ok((await listUploadDir()).includes(fileName), "file must exist in the upload root");
    assert.deepEqual(await listTempFiles(), [], "temp directory must be empty after success");
  });

  it("stores a valid video and reports it as a video", async () => {
    const { status, body } = await postUpload(WEBM_HEADER, "clip.webm", "video/webm", {
      token: adminToken,
      type: "video",
    });
    assert.equal(status, 201);
    const data = body.data as Record<string, unknown>;
    assert.equal(data.type, "video");
    assert.equal(data.mimeType, "video/webm");
    assert.match(String(data.url), /^\/uploads\/.+\.webm$/);
  });

  it("serves stored files publicly with the right content type", async () => {
    const { status, body } = await postUpload(PNG_1PX, "public.png", "image/png", {
      token: adminToken,
      type: "image",
    });
    assert.equal(status, 201);
    const url = String((body.data as Record<string, unknown>).url);

    const response = await fetch(`${baseUrl}${url}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(response.headers.get("cross-origin-resource-policy"), "cross-origin");
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length, PNG_1PX.length);
    assert.ok(bytes.equals(PNG_1PX));
  });

  it("never serves files outside the upload directory", async () => {
    const dotfile = await fetch(`${baseUrl}/uploads/.env`);
    assert.ok(dotfile.status >= 400, `expected rejection, got ${dotfile.status}`);

    const traversal = await fetch(`${baseUrl}/uploads/%2e%2e%2f%2e%2e%2fpackage.json`);
    assert.ok(traversal.status >= 400, `expected rejection, got ${traversal.status}`);
  });

  it("keeps filesystem paths and stack traces out of error responses", async () => {
    const { status, body } = await postUpload(Buffer.from("nope"), "x.png", "image/png", {
      token: adminToken,
    });
    const serialized = JSON.stringify(body);
    assert.ok(status >= 400);
    assert.ok(!serialized.includes(process.cwd()), "must not leak the server working directory");
    assert.ok(!serialized.includes("node_modules"));
    assert.ok(!/"stack"/.test(serialized));
  });
});
