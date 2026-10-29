import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { enquiriesRouter } from "./enquiries.routes.js";
import { galleryRouter } from "./gallery.routes.js";
import { reviewsRouter } from "./reviews.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", uptime: process.uptime() } });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/reviews", reviewsRouter);
apiRouter.use("/gallery", galleryRouter);
apiRouter.use("/enquiries", enquiriesRouter);
