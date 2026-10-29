import type { NextFunction, Request, Response } from "express";
import { verifyToken, type AuthPayload } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

/** Verifies the `Authorization: Bearer <token>` header. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }

  try {
    req.auth = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ success: false, message: "Session expired or token invalid." });
  }
}

/** Role gate — enforced here on the server, never only in the UI. */
export function requireRole(...roles: AuthPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ success: false, message: "You do not have permission to do that." });
      return;
    }
    next();
  };
}
