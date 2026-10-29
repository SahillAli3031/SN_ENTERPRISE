import { env } from "../config/env.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { hashPassword, User } from "../models/User.js";

/**
 * Creates (or updates) the administrator account from the environment.
 * Run with: npm run seed:admin
 */
async function seedAdmin(): Promise<void> {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before seeding.");
    process.exit(1);
  }

  await connectDb(env.MONGODB_URI);

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    existing.name = ADMIN_NAME ?? existing.name;
    await existing.save();
    console.log(`♻️  Updated existing admin: ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      name: ADMIN_NAME ?? "Site Admin",
      role: "admin",
    });
    console.log(`✅ Created admin account: ${ADMIN_EMAIL}`);
  }

  await disconnectDb();
}

seedAdmin().catch((error: unknown) => {
  console.error("❌ Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
