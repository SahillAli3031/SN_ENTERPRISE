import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

/**
 * Validates `req.body` against a Zod schema, replacing it with the parsed
 * value. Returns 422 with the first readable issue when validation fails.
 */
export function validateBody(schema: ZodType): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      const path = first?.path.join(".") || "body";
      return res.status(422).json({
        success: false,
        message: first ? `${path}: ${first.message}` : "Invalid request body.",
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    req.body = result.data;
    return next();
  };
}
