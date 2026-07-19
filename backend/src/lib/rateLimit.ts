import type { Request, Response, NextFunction } from "express";

/**
 * Minimal in-memory fixed-window rate limiter, keyed by client IP. Enough to
 * blunt credential-harvesting against the public lab-find endpoint on a single
 * internal instance. Not distributed — for prod, prefer nginx `limit_req`.
 */
export function rateLimit(opts: { windowMs: number; max: number; message?: string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip ?? "unknown";
    const entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + opts.windowMs });
      next();
      return;
    }

    if (entry.count >= opts.max) {
      res.status(429).json({ error: opts.message ?? "Too many requests. Try again later." });
      return;
    }

    entry.count += 1;
    next();
  };
}
