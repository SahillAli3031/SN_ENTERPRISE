import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createEnquiry,
  deleteEnquiry,
  listEnquiries,
  updateEnquiry,
} from "../controllers/enquiries.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { enquiryCreateSchema, enquiryStatusSchema } from "../validation/schemas.js";

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions. Please try again later." },
});

export const enquiriesRouter = Router();

enquiriesRouter.post("/", submitLimiter, validateBody(enquiryCreateSchema), createEnquiry);

// Admin
enquiriesRouter.get("/", requireAuth, requireRole("admin"), listEnquiries);
enquiriesRouter.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validateBody(enquiryStatusSchema),
  updateEnquiry,
);
enquiriesRouter.delete("/:id", requireAuth, requireRole("admin"), deleteEnquiry);
