import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_NAME: z.string().optional(),
  /** Directory (relative to the process working directory) that holds uploads. */
  UPLOAD_DIR: z.string().trim().min(1).default("uploads"),
  /** Maximum accepted image upload size in bytes (default 10 MB). */
  UPLOAD_MAX_IMAGE_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  /** Maximum accepted video upload size in bytes (default 100 MB). */
  UPLOAD_MAX_VIDEO_BYTES: z.coerce.number().int().positive().default(100 * 1024 * 1024),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
