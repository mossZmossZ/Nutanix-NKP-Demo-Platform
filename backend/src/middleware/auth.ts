import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthedRequest extends Request {
  user?: { id: string; role: "admin" | "user" };
}

/**
 * Stub JWT auth guard. Reads a bearer/cookie token, verifies it, and attaches
 * `req.user`. Full login/seed flow lands in Phase 1 (see PLAN.md).
 */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  // TODO(Phase 1): read from httpOnly cookie once cookie-parser + login flow land (see SECURITY.md).
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { id: string; role: "admin" | "user" };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

/**
 * Stub RBAC guard. Must run after `requireAuth`. Full enforcement + seeded
 * admin lands in Phase 1.
 */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
