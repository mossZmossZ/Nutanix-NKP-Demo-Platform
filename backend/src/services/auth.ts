import type { CookieOptions } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env, isProd } from "../config/env";
import { UserModel, type Role } from "../models/User";

export const AUTH_COOKIE = "token";

const TOKEN_TTL = "7d";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export interface TokenPayload {
  id: string;
  role: Role;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_TTL });
}

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProd,
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

/**
 * Upsert the static admin from env on every boot (env is the source of truth,
 * per the Phase 1 design). Overwrites the admin's password hash and role so a
 * rotated ADMIN_PASSWORD takes effect on restart.
 */
export async function seedAdmin(): Promise<void> {
  const passwordHash = await hashPassword(env.adminPassword);
  await UserModel.updateOne(
    { username: env.adminUser },
    { $set: { passwordHash, role: "admin" } },
    { upsert: true },
  );
  console.log(`Seeded admin user "${env.adminUser}"`);
}
