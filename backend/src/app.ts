import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { apiRouter } from "./routes/index.js";
import { UPLOADS_ROUTE, uploadRoot } from "./utils/uploadStorage.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "1mb" }));

// Uploaded media (gallery files stored on disk). Served outside `/api` so the
// API rate limit never throttles image/video requests, and with a permissive
// Cross-Origin-Resource-Policy so a frontend on another origin can still render
// it. `.tmp` staging files are dotfiles and are therefore never served.
app.use(
  UPLOADS_ROUTE,
  (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(uploadRoot(), {
    index: false,
    dotfiles: "deny",
    etag: true,
    lastModified: true,
    maxAge: "7d",
  }),
);

if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});

app.use("/api", apiLimiter);
app.use("/api", apiRouter);

app.get("/", (_req, res) => {
  res.json({ success: true, data: { service: "painting-platform-api", status: "running" } });
});

app.use(notFound);
app.use(errorHandler);
