import type { Request, Response } from "express";
import { User } from "../models/User.js";
import type { LoginInput } from "../validation/schemas.js";
import { signToken } from "../utils/jwt.js";

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401).json({ success: false, message: "Email or password is incorrect." });
    return;
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    res.status(401).json({ success: false, message: "Email or password is incorrect." });
    return;
  }

  const token = signToken({ sub: user.id, role: user.role });
  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
}

/** GET /api/auth/me */
export async function me(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.auth?.sub).select("-passwordHash").lean();
  if (!user) {
    res.status(404).json({ success: false, message: "Account not found." });
    return;
  }
  res.json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}
