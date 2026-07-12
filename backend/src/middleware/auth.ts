import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AUTH_COOKIE, type TokenPayload } from "../services/auth";

export interface AuthedRequest extends Request {
  user?: TokenPayload;
  // Express 5's ParamsDictionary widened values to `string | string[]` for
  // repeatable params; all routes here use single named params, so narrow back.
  params: Record<string, string>;
}

/**
 * JWT auth guard. Reads the httpOnly cookie, verifies it, and attaches
 * `req.user`.
 */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

/**
 * RBAC guard. Must run after `requireAuth`.
 */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
