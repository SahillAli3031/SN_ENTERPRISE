import mongoose from "mongoose";
import { env } from "../config/env.js";
import { connectDb, disconnectDb } from "../config/db.js";

/**
 * Removes smoke-test artifacts (test gallery item, enquiries, reviews).
 * Run with: npx tsx src/seed/cleanupTestArtifacts.ts
 */
async function cleanup(): Promise<void> {
  await connectDb(env.MONGODB_URI);
  const db = mongoose.connection.db;
  const gallery = await db!.collection("galleryitems").deleteMany({ title: "Test Interior" });
  const enquiries = await db!.collection("enquiries").deleteMany({});
  const reviews = await db!.collection("reviews").deleteMany({});
  console.log("deleted:", { gallery: gallery.deletedCount, enquiries: enquiries.deletedCount, reviews: reviews.deletedCount });
  await disconnectDb();
}

cleanup().catch((error: unknown) => {
  console.error("❌ Cleanup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
