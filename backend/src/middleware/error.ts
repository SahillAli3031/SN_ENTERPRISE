import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

/**
 * Error carrying a client-safe HTTP status and message. The response never
 * includes filesystem paths or stack traces.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: "Route not found." });
}

/** Central error handler — keeps stack traces out of production responses. */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    console.error(`❌ API error ${error.status}: ${error.message}`);
    res.status(error.status).json({ success: false, message: error.message });
    return;
  }

  if (error instanceof Error) {
    console.error("❌ API error:", error.message);
    const isValidation = error.name === "ValidationError";
    const isCast = error.name === "CastError";
    res.status(isValidation || isCast ? 400 : 500).json({
      success: false,
      message:
        isValidation || isCast
          ? "The submitted data is not valid."
          : "Something went wrong on our side. Please try again.",
      ...(env.NODE_ENV === "development" ? { detail: error.message } : {}),
    });
    return;
  }

  console.error("❌ Unknown API error:", error);
  res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
}
