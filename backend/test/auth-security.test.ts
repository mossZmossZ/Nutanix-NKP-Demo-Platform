import request from "supertest";
import type { Express } from "express";
import jwt from "jsonwebtoken";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";

const WRONG_SECRET = "not-the-real-secret";
const REAL_SECRET = "test-secret"; // matches test/setup.ts JWT_SECRET

function bodyLeaksSecrets(body: unknown): boolean {
  const s = JSON.stringify(body);
  return s.includes("passwordHash") || s.includes("$2");
}

let app: Express;

beforeAll(async () => {
  app = await setup();
});

afterAll(async () => {
  await teardown();
});

describe("login", () => {
  it("rejects wrong password with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: ADMIN.username,
      password: "totally-wrong",
    });
    expect(res.status).toBe(401);
  });

  it("rejects unknown username with 401 (not a distinguishable error)", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: "does-not-exist",
      password: "whatever123",
    });
    expect(res.status).toBe(401);
  });

  it("rejects missing username with 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ password: "whatever123" });
    expect(res.status).toBe(400);
  });

  it("rejects missing password with 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: ADMIN.username });
    expect(res.status).toBe(400);
  });

  it("rejects non-string username with 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: 12345, password: "whatever123" });
    expect(res.status).toBe(400);
  });

  it("rejects non-string password with 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: ADMIN.username, password: 12345 });
    expect(res.status).toBe(400);
  });

  it("NoSQL injection: username as {$ne:null} object must not authenticate", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
    expect(res.body?.role).not.toBe("admin");
  });

  it("NoSQL injection: username as {$gt:''} object must not authenticate", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: { $gt: "" }, password: { $gt: "" } });
    expect(res.status).toBe(400);
  });

  it("does not leak passwordHash/bcrypt hash in successful login response", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: ADMIN.username, password: ADMIN.password });
    expect(res.status).toBe(200);
    expect(bodyLeaksSecrets(res.body)).toBe(false);
  });
});

describe("logout", () => {
  it("returns 204 regardless of auth state", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(204);
  });
});

describe("cookie/JWT validation on /api/auth/me", () => {
  it("rejects when no cookie present -> 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret -> 401", async () => {
    const forged = jwt.sign({ id: "000000000000000000000000", role: "admin" }, WRONG_SECRET, {
      expiresIn: "1h",
    });
    const res = await request(app).get("/api/auth/me").set("Cookie", `token=${forged}`);
    expect(res.status).toBe(401);
  });

  it("rejects an expired token -> 401", async () => {
    const expired = jwt.sign({ id: "000000000000000000000000", role: "admin" }, REAL_SECRET, {
      expiresIn: -10,
    });
    const res = await request(app).get("/api/auth/me").set("Cookie", `token=${expired}`);
    expect(res.status).toBe(401);
  });

  it("rejects a syntactically-garbage token -> 401", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", "token=not-a-jwt-at-all");
    expect(res.status).toBe(401);
  });

  it("accepts a validly-signed, unexpired token for a real user", async () => {
    const agent = await loginAs(app, ADMIN.username, ADMIN.password);
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(bodyLeaksSecrets(res.body)).toBe(false);
  });
});

describe("cookie/JWT validation on /api/admin/users (representative admin route)", () => {
  it("rejects when no cookie present -> 401", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret, even if it claims role:admin -> 401", async () => {
    const forged = jwt.sign({ id: "000000000000000000000000", role: "admin" }, WRONG_SECRET, {
      expiresIn: "1h",
    });
    const res = await request(app).get("/api/admin/users").set("Cookie", `token=${forged}`);
    expect(res.status).toBe(401);
  });

  it("rejects an expired token -> 401", async () => {
    const expired = jwt.sign({ id: "000000000000000000000000", role: "admin" }, REAL_SECRET, {
      expiresIn: -10,
    });
    const res = await request(app).get("/api/admin/users").set("Cookie", `token=${expired}`);
    expect(res.status).toBe(401);
  });

  it("rejects a syntactically-garbage token -> 401", async () => {
    const res = await request(app).get("/api/admin/users").set("Cookie", "token=garbage.garbage.garbage");
    expect(res.status).toBe(401);
  });
});

describe("secret leakage across admin endpoints", () => {
  it("list/create/patch responses never contain passwordHash or bcrypt hash", async () => {
    const adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
    const created = await createUser(adminAgent, "leaktest-user", "leaktestpass1", "user");

    const listRes = await adminAgent.get("/api/admin/users");
    expect(bodyLeaksSecrets(listRes.body)).toBe(false);

    const patchRes = await adminAgent
      .patch(`/api/admin/users/${created.id}`)
      .send({ password: "newpassword1" });
    expect(bodyLeaksSecrets(patchRes.body)).toBe(false);
  });
});

describe("NoSQL injection on admin create", () => {
  it("username as {$ne:null} on create must not be accepted", async () => {
    const adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
    const res = await adminAgent
      .post("/api/admin/users")
      .send({ username: { $ne: null }, password: "somepassword1", role: "user" });
    expect(res.status).toBe(400);
  });
});
