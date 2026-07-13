import type { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AUTH_COOKIE, type TokenPayload } from "../services/auth";

function parseCookies(cookieHeader: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    map[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return map;
}

// Verify the JWT auth cookie on a WS upgrade request. Returns the payload or
// null (caller decides the HTTP status). Shared by the console + RDP tunnels.
export function authenticateUpgrade(request: IncomingMessage): TokenPayload | null {
  const token = parseCookies(request.headers.cookie ?? "")[AUTH_COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }
}
