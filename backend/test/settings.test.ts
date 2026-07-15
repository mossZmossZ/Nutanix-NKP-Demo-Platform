import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Express } from "express";
import type { Agent } from "supertest";
import request from "supertest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";
import { SettingsModel } from "../src/models/Settings";

let app: Express;
let adminAgent: Agent;

beforeAll(async () => {
  app = await setup();
  adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
});

afterAll(async () => {
  await teardown();
});

describe("Settings singleton defaults", () => {
  it("GET /api/admin/settings returns seeded defaults", async () => {
    const res = await adminAgent.get("/api/admin/settings");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ platformName: "NKP Workshop", defaultDocFontSize: 16 });
  });

  it("keeps a single settings document", async () => {
    await adminAgent.get("/api/admin/settings");
    await adminAgent.patch("/api/admin/settings").send({ platformName: "Once" });
    expect(await SettingsModel.countDocuments()).toBe(1);
  });
});

describe("PATCH /api/admin/settings", () => {
  it("persists platformName and defaultDocFontSize", async () => {
    const res = await adminAgent
      .patch("/api/admin/settings")
      .send({ platformName: "Acme Labs", defaultDocFontSize: 20 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ platformName: "Acme Labs", defaultDocFontSize: 20 });

    const reread = await adminAgent.get("/api/admin/settings");
    expect(reread.body).toEqual({ platformName: "Acme Labs", defaultDocFontSize: 20 });
  });

  it("rejects an empty platformName -> 400", async () => {
    const res = await adminAgent.patch("/api/admin/settings").send({ platformName: "   " });
    expect(res.status).toBe(400);
  });

  it("rejects an out-of-range font size -> 400", async () => {
    const res = await adminAgent.patch("/api/admin/settings").send({ defaultDocFontSize: 40 });
    expect(res.status).toBe(400);
  });

  it("rejects a non-integer font size -> 400", async () => {
    const res = await adminAgent.patch("/api/admin/settings").send({ defaultDocFontSize: 16.5 });
    expect(res.status).toBe(400);
  });
});

describe("settings RBAC", () => {
  let userAgent: Agent;

  beforeAll(async () => {
    await createUser(adminAgent, "settings-user", "settingsuserpass1", "user");
    userAgent = await loginAs(app, "settings-user", "settingsuserpass1");
  });

  it("GET /api/admin/settings -> 403 for a user-role account", async () => {
    const res = await userAgent.get("/api/admin/settings");
    expect(res.status).toBe(403);
  });

  it("PATCH /api/admin/settings -> 403 for a user-role account", async () => {
    const res = await userAgent.patch("/api/admin/settings").send({ platformName: "Hacked" });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/me/password", () => {
  it("changes the user's own password when the current password is correct", async () => {
    await createUser(adminAgent, "pw-change", "originalpass1", "user");
    const agent = await loginAs(app, "pw-change", "originalpass1");

    const res = await agent
      .post("/api/me/password")
      .send({ currentPassword: "originalpass1", newPassword: "brandnewpass2" });
    expect(res.status).toBe(204);

    // The new password now authenticates; the old one no longer does.
    await expect(loginAs(app, "pw-change", "brandnewpass2")).resolves.toBeDefined();
    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: "pw-change", password: "originalpass1" });
    expect(oldLogin.status).toBe(401);
  });

  it("rejects a wrong current password -> 400, password unchanged", async () => {
    await createUser(adminAgent, "pw-wrong", "originalpass1", "user");
    const agent = await loginAs(app, "pw-wrong", "originalpass1");

    const res = await agent
      .post("/api/me/password")
      .send({ currentPassword: "not-the-password", newPassword: "brandnewpass2" });
    expect(res.status).toBe(400);

    // Original password still works.
    await expect(loginAs(app, "pw-wrong", "originalpass1")).resolves.toBeDefined();
  });

  it("rejects a too-short new password -> 400", async () => {
    await createUser(adminAgent, "pw-short", "originalpass1", "user");
    const agent = await loginAs(app, "pw-short", "originalpass1");

    const res = await agent
      .post("/api/me/password")
      .send({ currentPassword: "originalpass1", newPassword: "short" });
    expect(res.status).toBe(400);
  });

  it("requires authentication -> 401", async () => {
    const res = await request(app)
      .post("/api/me/password")
      .send({ currentPassword: "x", newPassword: "brandnewpass2" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/me/settings + PATCH /api/me/preferences", () => {
  it("resolves docFontSize to the platform default when the user has no preference", async () => {
    await adminAgent.patch("/api/admin/settings").send({ platformName: "Resolve Co", defaultDocFontSize: 18 });
    await createUser(adminAgent, "pref-default", "prefdefaultpass1", "user");
    const agent = await loginAs(app, "pref-default", "prefdefaultpass1");

    const res = await agent.get("/api/me/settings");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ platformName: "Resolve Co", docFontSize: 18 });
  });

  it("PATCH persists a per-user override that wins over the default", async () => {
    await adminAgent.patch("/api/admin/settings").send({ defaultDocFontSize: 18 });
    await createUser(adminAgent, "pref-override", "prefoverridepass1", "user");
    const agent = await loginAs(app, "pref-override", "prefoverridepass1");

    const patch = await agent.patch("/api/me/preferences").send({ docFontSize: 22 });
    expect(patch.status).toBe(200);
    expect(patch.body).toEqual({ docFontSize: 22 });

    const res = await agent.get("/api/me/settings");
    expect(res.body.docFontSize).toBe(22);
  });

  it("rejects an out-of-range docFontSize -> 400", async () => {
    await createUser(adminAgent, "pref-badrange", "prefbadrangepass1", "user");
    const agent = await loginAs(app, "pref-badrange", "prefbadrangepass1");

    const res = await agent.patch("/api/me/preferences").send({ docFontSize: 4 });
    expect(res.status).toBe(400);
  });

  it("GET /api/me/settings requires authentication -> 401", async () => {
    const res = await request(app).get("/api/me/settings");
    expect(res.status).toBe(401);
  });
});
