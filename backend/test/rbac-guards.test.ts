import type { Express } from "express";
import type { Agent } from "supertest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";

let app: Express;
let adminAgent: Agent;

beforeAll(async () => {
  app = await setup();
  adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
});

afterAll(async () => {
  await teardown();
});

describe("privilege escalation: user role vs admin routes", () => {
  let userAgent: Agent;

  beforeAll(async () => {
    await createUser(adminAgent, "plain-user-1", "plainuserpass1", "user");
    userAgent = await loginAs(app, "plain-user-1", "plainuserpass1");
  });

  it("GET /api/admin/users -> 403 for a user-role account", async () => {
    const res = await userAgent.get("/api/admin/users");
    expect(res.status).toBe(403);
  });

  it("POST /api/admin/users -> 403 for a user-role account", async () => {
    const res = await userAgent
      .post("/api/admin/users")
      .send({ username: "should-not-be-created", password: "password123", role: "user" });
    expect(res.status).toBe(403);
  });

  it("PATCH /api/admin/users/:id -> 403 for a user-role account", async () => {
    const res = await userAgent
      .patch("/api/admin/users/000000000000000000000000")
      .send({ role: "admin" });
    expect(res.status).toBe(403);
  });

  it("DELETE /api/admin/users/:id -> 403 for a user-role account", async () => {
    const res = await userAgent.delete("/api/admin/users/000000000000000000000000");
    expect(res.status).toBe(403);
  });

  it("a user-role account cannot self-escalate via PATCH on its own id", async () => {
    const me = await userAgent.get("/api/auth/me");
    const res = await userAgent.patch(`/api/admin/users/${me.body.id}`).send({ role: "admin" });
    expect(res.status).toBe(403);
  });
});

describe("input validation on admin create/patch", () => {
  it("password length < 8 on create -> 400", async () => {
    const res = await adminAgent
      .post("/api/admin/users")
      .send({ username: "shortpass-user", password: "short1", role: "user" });
    expect(res.status).toBe(400);
  });

  it("password length == 8 on create -> allowed (201)", async () => {
    const res = await adminAgent
      .post("/api/admin/users")
      .send({ username: "eightchar-user", password: "eightch1", role: "user" });
    expect(res.status).toBe(201);
  });

  it("role not in {admin,user} (string) on create -> 400", async () => {
    const res = await adminAgent
      .post("/api/admin/users")
      .send({ username: "superuser-attempt", password: "password123", role: "superuser" });
    expect(res.status).toBe(400);
  });

  it("role as number on create -> 400", async () => {
    const res = await adminAgent
      .post("/api/admin/users")
      .send({ username: "numeric-role-attempt", password: "password123", role: 123 });
    expect(res.status).toBe(400);
  });

  it("role as null on create -> 400", async () => {
    const res = await adminAgent
      .post("/api/admin/users")
      .send({ username: "null-role-attempt", password: "password123", role: null });
    expect(res.status).toBe(400);
  });

  it("duplicate username on create -> 409", async () => {
    await createUser(adminAgent, "dup-user", "duppassword1", "user");
    const res = await adminAgent
      .post("/api/admin/users")
      .send({ username: "dup-user", password: "duppassword2", role: "user" });
    expect(res.status).toBe(409);
  });

  it("password length < 8 on patch -> 400", async () => {
    const created = await createUser(adminAgent, "patch-short-user", "patchpass1", "user");
    const res = await adminAgent.patch(`/api/admin/users/${created.id}`).send({ password: "short1" });
    expect(res.status).toBe(400);
  });

  it("password length == 8 on patch -> allowed (200)", async () => {
    const created = await createUser(adminAgent, "patch-eight-user", "patchpass1", "user");
    const res = await adminAgent.patch(`/api/admin/users/${created.id}`).send({ password: "eightch1" });
    expect(res.status).toBe(200);
  });

  it("role not in {admin,user} on patch -> 400", async () => {
    const created = await createUser(adminAgent, "patch-badrole-user", "patchpass1", "user");
    const res = await adminAgent
      .patch(`/api/admin/users/${created.id}`)
      .send({ role: "superuser" });
    expect(res.status).toBe(400);
  });
});

describe("self-protection and last-admin guards", () => {
  it("PATCH/DELETE a non-existent id -> 404", async () => {
    const nonExistentId = "0123456789abcdef01234567";
    const patchRes = await adminAgent
      .patch(`/api/admin/users/${nonExistentId}`)
      .send({ role: "user" });
    expect(patchRes.status).toBe(404);

    const deleteRes = await adminAgent.delete(`/api/admin/users/${nonExistentId}`);
    expect(deleteRes.status).toBe(404);
  });

  it("admin cannot delete their own account -> 409, account still exists", async () => {
    const me = await adminAgent.get("/api/auth/me");
    expect(me.status).toBe(200);

    const res = await adminAgent.delete(`/api/admin/users/${me.body.id}`);
    expect(res.status).toBe(409);

    const stillThere = await adminAgent.get("/api/auth/me");
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.id).toBe(me.body.id);
  });

  it("with TWO admins present, deleting ONE (not last) via the other's session is allowed", async () => {
    const extra = await createUser(adminAgent, "extra-admin-del", "extraadminpass1", "admin");
    const extraAgent = await loginAs(app, "extra-admin-del", "extraadminpass1");

    // adminAgent (seeded admin) deletes extra admin; two admins present -> not last -> allowed.
    const res = await adminAgent.delete(`/api/admin/users/${extra.id}`);
    expect(res.status).toBe(204);

    // extra's session is now invalid for admin routes (user deleted), sanity check via seeded admin.
    const check = await adminAgent.get(`/api/auth/me`);
    expect(check.status).toBe(200);
    void extraAgent; // session no longer usable; kept for clarity of intent
  });

  it("cannot delete the last remaining admin -> 409, admin still present", async () => {
    // Structural note: when exactly one admin exists, only that admin can
    // authenticate against admin-only routes, so "delete the last admin" is
    // necessarily a self-delete. This is the same call as the self-delete
    // test above; we re-assert here to pin the last-admin invariant
    // (count stays >= 1) explicitly, independent of the self-delete wording.
    const before = await adminAgent.get("/api/admin/users");
    const adminsBefore = before.body.filter((u: { role: string }) => u.role === "admin");
    expect(adminsBefore.length).toBe(1);

    const res = await adminAgent.delete(`/api/admin/users/${adminsBefore[0].id}`);
    expect(res.status).toBe(409);

    const after = await adminAgent.get("/api/admin/users");
    const adminsAfter = after.body.filter((u: { role: string }) => u.role === "admin");
    expect(adminsAfter.length).toBe(1);
  });

  it("with TWO admins present, demoting ONE (not last) via the other's session is allowed", async () => {
    const adminA = await createUser(adminAgent, "guard-admin-a", "guardadminpassA", "admin");
    const adminAAgent = await loginAs(app, "guard-admin-a", "guardadminpassA");

    // Two admins now: seeded admin + adminA. Demoting adminA via seeded admin's session is allowed.
    const res = await adminAgent.patch(`/api/admin/users/${adminA.id}`).send({ role: "user" });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("user");
    void adminAAgent;
  });

  it("PATCH demote the last admin's role to user -> 409, admin stays admin", async () => {
    // Structural note: same as delete above — with exactly one admin, only
    // that admin can call this route, so demoting "the last admin" is
    // necessarily self-demote. Verify the guard blocks it and role is unchanged.
    const list = await adminAgent.get("/api/admin/users");
    const admins = list.body.filter((u: { role: string }) => u.role === "admin");
    expect(admins.length).toBe(1);
    const loneAdminId = admins[0].id;

    const res = await adminAgent.patch(`/api/admin/users/${loneAdminId}`).send({ role: "user" });
    expect(res.status).toBe(409);

    const check = await adminAgent.get("/api/admin/users");
    const adminAfter = check.body.find((u: { id: string }) => u.id === loneAdminId);
    expect(adminAfter.role).toBe("admin");
  });
});
