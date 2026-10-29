import { app } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { cleanupStaleTempFiles, ensureUploadDirs } from "./utils/uploadStorage.js";

async function bootstrap(): Promise<void> {
  await connectDb(env.MONGODB_URI);
  // Prepare the media upload directory and drop temp files left by a crash.
  await ensureUploadDirs();
  await cleanupStaleTempFiles();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 API listening on http://localhost:${env.PORT}/api`);
    console.log(`   CORS origin: ${env.CORS_ORIGIN}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received — shutting down...`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((error: unknown) => {
  console.error("❌ Failed to start server:", error instanceof Error ? error.message : error);
  process.exit(1);
});
