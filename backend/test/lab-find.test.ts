import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Express } from "express";
import type { Agent } from "supertest";
import request from "supertest";
import { setup, teardown, loginAs, ADMIN } from "./helpers/harness";

let app: Express;
let adminAgent: Agent;

const EMAIL = "learner1@corp.com";
const PASSWORD = "learner-pass-1";
const CODE = "room-42";

beforeAll(async () => {
  app = await setup();
  adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
  await adminAgent
    .post("/api/admin/users")
    .send({ username: "learner1", password: PASSWORD, role: "user", email: EMAIL });
});

afterAll(async () => {
  await teardown();
});

// The lookup is intentionally unauthenticated; the workshop code is the gate.
describe("POST /api/lab-find (credential lookup gate)", () => {
  it("400 when email is missing", async () => {
    const res = await request(app).post("/api/lab-find").send({ code: CODE });
    expect(res.status).toBe(400);
  });

  it("400 when code is missing", async () => {
    const res = await request(app).post("/api/lab-find").send({ email: EMAIL });
    expect(res.status).toBe(400);
  });

  it("404 (fail-closed) when no workshop code is configured", async () => {
    const res = await request(app).post("/api/lab-find").send({ email: EMAIL, code: "anything" });
    expect(res.status).toBe(404);
  });

  it("404 on a wrong code once a code is set", async () => {
    await adminAgent.patch("/api/admin/settings").send({ workshopCode: CODE });
    const res = await request(app).post("/api/lab-find").send({ email: EMAIL, code: "nope" });
    expect(res.status).toBe(404);
  });

  it("returns the decrypted password with the right email + code", async () => {
    const res = await request(app).post("/api/lab-find").send({ email: EMAIL, code: CODE });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ username: "learner1", password: PASSWORD });
  });

  it("404 for an unknown email even with the right code", async () => {
    const res = await request(app)
      .post("/api/lab-find")
      .send({ email: "nobody@corp.com", code: CODE });
    expect(res.status).toBe(404);
  });
});
