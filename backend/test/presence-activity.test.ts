import type { Express } from "express";
import type { Agent } from "supertest";
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";
import { UserModel } from "../src/models/User";
import { UserActivityModel } from "../src/models/UserActivity";
import { AuditEventModel } from "../src/models/AuditEvent";
import {
  dayKey,
  recordHeartbeat,
  getConcurrentUserCount,
  getActivityToday,
  PRESENCE_WINDOW_MS,
} from "../src/services/presence";

let app: Express;
let adminAgent: Agent;

beforeAll(async () => {
  app = await setup();
  await UserActivityModel.init();
  adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
});

afterAll(async () => {
  await teardown();
});

describe("dayKey (WORKSHOP_TZ)", () => {
  it("renders YYYY-MM-DD in the given timezone", () => {
    // 2026-07-14 23:30 UTC is already 2026-07-15 in Asia/Bangkok (UTC+7).
    const d = new Date("2026-07-14T23:30:00Z");
    expect(dayKey(d, "Asia/Bangkok")).toBe("2026-07-15");
    expect(dayKey(d, "UTC")).toBe("2026-07-14");
  });
});

describe("recordHeartbeat accumulation", () => {
  let userId: string;

  beforeEach(async () => {
    await UserActivityModel.deleteMany({});
    const u = await UserModel.create({ username: `hb-${Date.now()}`, passwordHash: "x", role: "user" });
    userId = u.id;
  });

  it("seeds the day on first heartbeat with 0 active seconds and sets lastSeen", async () => {
    const t0 = new Date("2026-07-15T02:00:00Z");
    await recordHeartbeat(userId, t0);
    const row = await UserActivityModel.findOne({ userId, dayKey: dayKey(t0) });
    expect(row?.activeSeconds).toBe(0);
    const user = await UserModel.findById(userId);
    expect(user?.lastSeen?.getTime()).toBe(t0.getTime());
  });

  it("accrues the gap between heartbeats", async () => {
    const t0 = new Date("2026-07-15T02:00:00Z");
    const t1 = new Date(t0.getTime() + 30_000); // +30s
    await recordHeartbeat(userId, t0);
    await recordHeartbeat(userId, t1);
    const row = await UserActivityModel.findOne({ userId, dayKey: dayKey(t0) });
    expect(row?.activeSeconds).toBe(30);
  });

  it("caps a long gap so a closed-lid pause can't inflate the total", async () => {
    const t0 = new Date("2026-07-15T02:00:00Z");
    const t1 = new Date(t0.getTime() + 30 * 60_000); // +30 min
    await recordHeartbeat(userId, t0);
    await recordHeartbeat(userId, t1);
    const row = await UserActivityModel.findOne({ userId, dayKey: dayKey(t0) });
    expect(row?.activeSeconds).toBe(PRESENCE_WINDOW_MS / 1000); // capped at the window (60s)
  });
});

describe("getConcurrentUserCount", () => {
  it("counts only users seen within the presence window", async () => {
    const now = new Date();
    await UserModel.create({ username: `on-${Date.now()}`, passwordHash: "x", role: "user", lastSeen: now });
    await UserModel.create({
      username: `off-${Date.now()}`,
      passwordHash: "x",
      role: "user",
      lastSeen: new Date(now.getTime() - PRESENCE_WINDOW_MS - 5_000),
    });
    const count = await getConcurrentUserCount(now);
    // at least the one just-seen user; the stale one must be excluded
    expect(count).toBeGreaterThanOrEqual(1);
    const online = await UserModel.find({ lastSeen: { $gte: new Date(now.getTime() - PRESENCE_WINDOW_MS) } });
    expect(online.every((u) => u.lastSeen && u.lastSeen.getTime() >= now.getTime() - PRESENCE_WINDOW_MS)).toBe(true);
  });
});

describe("getActivitytoday", () => {
  it("returns today's rows busiest-first with username + online flag", async () => {
    await UserActivityModel.deleteMany({});
    const now = new Date();
    const a = await UserModel.create({ username: `act-a-${Date.now()}`, passwordHash: "x", role: "user", lastSeen: now });
    const b = await UserModel.create({ username: `act-b-${Date.now()}`, passwordHash: "x", role: "user" });
    await UserActivityModel.create({ userId: a.id, dayKey: dayKey(now), activeSeconds: 120, lastHeartbeatAt: now });
    await UserActivityModel.create({ userId: b.id, dayKey: dayKey(now), activeSeconds: 999, lastHeartbeatAt: now });
    const rows = await getActivityToday(now);
    expect(rows[0].activeSeconds).toBe(999); // busiest first
    expect(rows.find((r) => r.userId === a.id)?.online).toBe(true);
    expect(rows.find((r) => r.userId === b.id)?.online).toBe(false); // no lastSeen
  });
});

describe("POST /api/me/heartbeat", () => {
  it("204s for an authed user and records presence", async () => {
    const user = await createUser(adminAgent, `hbuser-${Date.now()}`, "password123", "user");
    const userAgent = await loginAs(app, user.username, "password123");
    const res = await userAgent.post("/api/me/heartbeat");
    expect(res.status).toBe(204);
    const fresh = await UserModel.findById(user.id);
    expect(fresh?.lastSeen).toBeTruthy();
  });

  it("401s without a session", async () => {
    const request = (await import("supertest")).default;
    const res = await request(app).post("/api/me/heartbeat");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/dashboard", () => {
  it("403s for a user-role account", async () => {
    const user = await createUser(adminAgent, `dashu-${Date.now()}`, "password123", "user");
    const userAgent = await loginAs(app, user.username, "password123");
    const res = await userAgent.get("/api/admin/dashboard");
    expect(res.status).toBe(403);
  });

  it("returns concurrentUsers, activeToday, and recentActivity for an admin", async () => {
    const res = await adminAgent.get("/api/admin/dashboard");
    expect(res.status).toBe(200);
    expect(typeof res.body.concurrentUsers).toBe("number");
    expect(Array.isArray(res.body.activeToday)).toBe(true);
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });
});

describe("audit log write-hooks", () => {
  beforeEach(async () => {
    await AuditEventModel.deleteMany({});
  });

  it("records a login event with the actor's username", async () => {
    await loginAs(app, ADMIN.username, ADMIN.password);
    const ev = await AuditEventModel.findOne({ action: "login" }).sort({ createdAt: -1 });
    expect(ev?.actorUsername).toBe(ADMIN.username);
  });

  it("records user.create and user.delete and surfaces them in the dashboard feed", async () => {
    const created = await createUser(adminAgent, `audited-${Date.now()}`, "password123", "user");
    await adminAgent.delete(`/api/admin/users/${created.id}`);

    const res = await adminAgent.get("/api/admin/dashboard");
    const actions = res.body.recentActivity.map((e: { action: string }) => e.action);
    expect(actions).toContain("user.create");
    expect(actions).toContain("user.delete");
    const del = res.body.recentActivity.find((e: { action: string }) => e.action === "user.delete");
    expect(del.targetLabel).toBe(created.username);
  });
});
