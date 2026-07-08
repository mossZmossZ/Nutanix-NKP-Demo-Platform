import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Express, Agent } from "supertest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";

describe("Phase 1: Auth & RBAC Smoke Tests", () => {
  let app: Express;
  let adminAgent: Agent;

  beforeAll(async () => {
    app = await setup();
    adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
  });

  afterAll(async () => {
    await teardown();
  });

  describe("POST /api/auth/login", () => {
    it("should log in with correct credentials and set httpOnly cookie", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: ADMIN.username, password: ADMIN.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("username", ADMIN.username);
      expect(res.body).toHaveProperty("role", "admin");
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toContain("token");
      expect(res.headers["set-cookie"][0]).toContain("HttpOnly");
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: ADMIN.username, password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("should reject login with nonexistent user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "nonexistent", password: "password123" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user data with valid cookie", async () => {
      const agent = await loginAs(app, ADMIN.username, ADMIN.password);
      const res = await agent.get("/api/auth/me");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("username", ADMIN.username);
      expect(res.body).toHaveProperty("role", "admin");
      expect(res.body).not.toHaveProperty("passwordHash");
    });

    it("should reject /api/auth/me without cookie", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear the auth cookie on logout", async () => {
      const agent = await loginAs(app, ADMIN.username, ADMIN.password);
      const res = await agent.post("/api/auth/logout");

      expect(res.status).toBe(204);
      // Verify the cookie is cleared by attempting to use the agent afterward
      const meRes = await agent.get("/api/auth/me");
      expect(meRes.status).toBe(401);
    });
  });

  describe("GET /api/admin/users", () => {
    it("should return list of users with public fields only", async () => {
      const res = await adminAgent.get("/api/admin/users");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Verify each user has public fields and no passwordHash
      res.body.forEach((user: any) => {
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("username");
        expect(user).toHaveProperty("role");
        expect(user).toHaveProperty("createdAt");
        expect(user).not.toHaveProperty("passwordHash");
      });
    });

    it("should reject list users without admin privilege", async () => {
      // Create a non-admin user
      const user = await createUser(adminAgent, "regular-user", "password123", "user");
      const userAgent = await loginAs(app, "regular-user", "password123");

      const res = await userAgent.get("/api/admin/users");

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/admin/users", () => {
    it("should create a new user with valid data", async () => {
      const res = await adminAgent
        .post("/api/admin/users")
        .send({ username: "newuser", password: "password123", role: "user" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("username", "newuser");
      expect(res.body).toHaveProperty("role", "user");
      expect(res.body).not.toHaveProperty("passwordHash");
      expect(res.body).not.toHaveProperty("password");
    });

    it("should enforce password minimum length", async () => {
      const res = await adminAgent
        .post("/api/admin/users")
        .send({ username: "shortpass", password: "short", role: "user" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should validate role field", async () => {
      const res = await adminAgent
        .post("/api/admin/users")
        .send({ username: "invalid-role", password: "password123", role: "superuser" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should reject duplicate usernames", async () => {
      // Create first user
      await adminAgent
        .post("/api/admin/users")
        .send({ username: "duplicated", password: "password123", role: "user" });

      // Try to create with same username
      const res = await adminAgent
        .post("/api/admin/users")
        .send({ username: "duplicated", password: "differentpass", role: "user" });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("PATCH /api/admin/users/:id", () => {
    it("should update user role", async () => {
      // Create a user
      const created = await createUser(adminAgent, "rolechange-user", "password123", "user");

      // Change role to admin
      const res = await adminAgent
        .patch(`/api/admin/users/${created.id}`)
        .send({ role: "admin" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("role", "admin");
    });

    it("should update user password and allow login with new password", async () => {
      // Create a user
      const created = await createUser(adminAgent, "password-change-user", "oldpassword123", "user");

      // Change password
      const res = await adminAgent
        .patch(`/api/admin/users/${created.id}`)
        .send({ password: "newpassword123" });

      expect(res.status).toBe(200);

      // Verify old password doesn't work
      const oldLoginRes = await request(app)
        .post("/api/auth/login")
        .send({ username: "password-change-user", password: "oldpassword123" });
      expect(oldLoginRes.status).toBe(401);

      // Verify new password works
      const newLoginRes = await request(app)
        .post("/api/auth/login")
        .send({ username: "password-change-user", password: "newpassword123" });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body).toHaveProperty("id");
    });

    it("should reject 404 for nonexistent user", async () => {
      const res = await adminAgent
        .patch("/api/admin/users/nonexistent-id")
        .send({ role: "admin" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/admin/users/:id", () => {
    it("should delete a user", async () => {
      // Create a user
      const created = await createUser(adminAgent, "delete-user", "password123", "user");

      // Delete the user
      const res = await adminAgent.delete(`/api/admin/users/${created.id}`);

      expect(res.status).toBe(204);

      // Verify the user is gone (cannot log in)
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ username: "delete-user", password: "password123" });
      expect(loginRes.status).toBe(401);
    });

    it("should reject deletion of nonexistent user", async () => {
      const res = await adminAgent.delete("/api/admin/users/nonexistent-id");

      expect(res.status).toBe(404);
    });
  });

  describe("End-to-end: created user can log in and access /api/auth/me", () => {
    it("should allow a newly created user to log in and access /api/auth/me", async () => {
      // Create a new user
      const created = await createUser(adminAgent, "e2e-user", "e2epassword123", "user");

      // Log in as the new user
      const userAgent = await loginAs(app, "e2e-user", "e2epassword123");

      // Access /api/auth/me
      const res = await userAgent.get("/api/auth/me");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", created.id);
      expect(res.body).toHaveProperty("username", "e2e-user");
      expect(res.body).toHaveProperty("role", "user");
    });
  });

  describe("Admin privileges", () => {
    it("should reject non-admin from accessing admin routes", async () => {
      // Create a regular user
      await createUser(adminAgent, "normal-user", "password123", "user");
      const userAgent = await loginAs(app, "normal-user", "password123");

      // Try to create another user (should fail)
      const res = await userAgent
        .post("/api/admin/users")
        .send({ username: "another-user", password: "password123", role: "user" });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error");
    });
  });
});
