import "./testEnv.js";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import mongoose from "mongoose";
import { test } from "node:test";
import { app } from "../app.js";
import { GalleryItem } from "../models/GalleryItem.js";
import { signToken } from "../utils/jwt.js";
import { uploadRoot } from "../utils/uploadStorage.js";
import { TEST_UPLOAD_DIR } from "./testEnv.js";

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const ADMIN = { Authorization: `Bearer ${signToken({ sub: "test-admin", role: "admin" })}` };
const JSON_HEADERS = { ...ADMIN, "Content-Type": "application/json" };

/**
 * Runs against a local, throwaway database (`painting_platform_test`). Skips
 * cleanly when MongoDB is not running so the rest of the suite still passes.
 */
test("gallery persistence with device uploads", async (t) => {
  let connected = false;
  let server: Server | null = null;

  try {
    await mongoose.connect(process.env.MONGODB_URI as string, { serverSelectionTimeoutMS: 2000 });
    connected = true;
  } catch {
    connected = false;
  }

  if (!connected) {
    t.skip("Local MongoDB is not reachable — persistence tests skipped.");
    return;
  }

  try {
    await GalleryItem.deleteMany({});
    await fs.rm(path.resolve(process.cwd(), TEST_UPLOAD_DIR), { recursive: true, force: true });

    server = createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
    const baseUrl = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;

    const upload = async (type: string) => {
      const form = new FormData();
      form.append("type", type);
      form.append("file", new Blob([new Uint8Array(PNG_1PX)], { type: "image/png" }), "p.png");
      const response = await fetch(`${baseUrl}/api/gallery/upload`, {
        method: "POST",
        headers: ADMIN,
        body: form,
      });
      const body = (await response.json()) as { data?: { url?: string; fileName?: string } };
      return { status: response.status, url: String(body.data?.url), fileName: String(body.data?.fileName) };
    };

    await t.test("creates and persists a gallery record from an uploaded file", async () => {
      const uploaded = await upload("image");
      assert.equal(uploaded.status, 201);

      const created = await fetch(`${baseUrl}/api/gallery`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          title: "Uploaded hallway",
          category: "interior",
          type: "image",
          imageUrl: uploaded.url,
          alt: "Hallway painted from a device upload",
          published: true,
        }),
      });
      assert.equal(created.status, 201);
      const record = ((await created.json()) as { data: Record<string, unknown> }).data;
      assert.equal(record.imageUrl, uploaded.url);

      // The record survives round trips: admin listing + public listing.
      const adminList = (await (
        await fetch(`${baseUrl}/api/gallery/all`, { headers: ADMIN })
      ).json()) as { data: Array<Record<string, unknown>> };
      assert.equal(adminList.data.length, 1);

      const publicList = (await (
        await fetch(`${baseUrl}/api/gallery?category=interior`)
      ).json()) as { data: Array<Record<string, unknown>> };
      assert.equal(publicList.data.length, 1);
      assert.equal(publicList.data[0].imageUrl, uploaded.url);

      // The stored file is retrievable without authentication.
      const media = await fetch(`${baseUrl}${uploaded.url}`);
      assert.equal(media.status, 200);
      assert.equal(media.headers.get("content-type"), "image/png");

      await GalleryItem.deleteMany({});
      await fs.rm(path.resolve(process.cwd(), TEST_UPLOAD_DIR), { recursive: true, force: true });
    });

    await t.test("keeps the existing URL-based create contract working", async () => {
      const created = await fetch(`${baseUrl}/api/gallery`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          title: "Remote photograph",
          category: "exterior",
          type: "image",
          imageUrl: "https://images.example.com/house.jpg",
          alt: "House photographed from a remote URL",
          published: false,
        }),
      });
      assert.equal(created.status, 201);
      const publicList = (await (
        await fetch(`${baseUrl}/api/gallery`)
      ).json()) as { data: unknown[] };
      assert.equal(publicList.data.length, 0, "unpublished items stay off the public listing");

      await GalleryItem.deleteMany({});
    });

    await t.test("removes a stored file when its record is replaced and deleted", async () => {
      const uploaded = await upload("image");
      const created = (await (
        await fetch(`${baseUrl}/api/gallery`, {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({
            title: "Replaceable item",
            category: "commercial",
            type: "image",
            imageUrl: uploaded.url,
            alt: "Item whose media will be replaced",
            published: true,
          }),
        })
      ).json()) as { data: { id: string } };

      const storedPath = path.join(uploadRoot(), uploaded.fileName);
      await fs.access(storedPath);

      // Replacing the media URL releases the old stored file.
      await fetch(`${baseUrl}/api/gallery/${created.data.id}`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ imageUrl: "https://images.example.com/new.jpg" }),
      });
      await assert.rejects(fs.access(storedPath), "replaced upload should be removed");

      // Deleting a record that still points at a stored file removes it too.
      const second = await upload("image");
      const secondPath = path.join(uploadRoot(), second.fileName);
      const secondRecord = (await (
        await fetch(`${baseUrl}/api/gallery`, {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({
            title: "Deleted item",
            category: "commercial",
            type: "image",
            imageUrl: second.url,
            alt: "Item that will be deleted",
            published: true,
          }),
        })
      ).json()) as { data: { id: string } };
      await fs.access(secondPath);
      const removed = await fetch(`${baseUrl}/api/gallery/${secondRecord.data.id}`, {
        method: "DELETE",
        headers: ADMIN,
      });
      assert.equal(removed.status, 200);
      await assert.rejects(fs.access(secondPath), "deleted upload should be removed");
    });
  } finally {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    if (connected) {
      await GalleryItem.deleteMany({}).catch(() => undefined);
      await mongoose.connection.dropDatabase().catch(() => undefined);
      await mongoose.disconnect().catch(() => undefined);
    }
    await fs.rm(path.resolve(process.cwd(), TEST_UPLOAD_DIR), { recursive: true, force: true });
  }
});
