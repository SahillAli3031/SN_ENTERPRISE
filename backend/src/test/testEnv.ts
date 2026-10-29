/**
 * Test environment for the backend suite.
 *
 * Import this module FIRST in every test file — before anything that reads
 * `config/env.ts`. It pins the process to a local throwaway database and a
 * dedicated upload directory, so tests can never touch the real `.env`
 * database or the development upload folder. `dotenv` never overrides values
 * that are already set, so these win.
 */
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/painting_platform_test";
process.env.JWT_SECRET = "backend-suite-test-secret";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.UPLOAD_DIR = "uploads-test";
// Small limits keep the size-limit tests fast; they are still configurable.
process.env.UPLOAD_MAX_IMAGE_BYTES = "2048";
process.env.UPLOAD_MAX_VIDEO_BYTES = "4096";

export const TEST_UPLOAD_DIR = "uploads-test";
