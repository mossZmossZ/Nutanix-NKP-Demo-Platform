import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request, { type Agent } from "supertest";
import type { Express } from "express";
import { createApp } from "../../src/app";
import { seedAdmin } from "../../src/services/auth";

/** Seeded admin credentials (must match test/setup.ts). */
export const ADMIN = { username: "admin", password: "admin-pass-123" };

let mem: MongoMemoryServer;

/**
 * Boot a fresh in-memory Mongo + the real Express app with the admin seeded.
 * Call in beforeAll; pair with teardown() in afterAll.
 */
export async function setup(): Promise<Express> {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  await seedAdmin();
  return createApp();
}

export async function teardown(): Promise<void> {
  await mongoose.disconnect();
  await mem.stop();
}

/** A supertest agent (persists cookies) already logged in as the given user. */
export async function loginAs(app: Express, username: string, password: string): Promise<Agent> {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ username, password });
  if (res.status !== 200) throw new Error(`login failed for ${username}: ${res.status} ${res.text}`);
  return agent;
}

/** Create a user as an admin agent; returns the created user's public fields. */
export async function createUser(
  adminAgent: Agent,
  username: string,
  password: string,
  role: "admin" | "user",
) {
  const res = await adminAgent.post("/api/admin/users").send({ username, password, role });
  if (res.status !== 201) throw new Error(`createUser failed: ${res.status} ${res.text}`);
  return res.body as { id: string; username: string; role: string };
}
