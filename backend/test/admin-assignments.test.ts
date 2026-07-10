import type { Express } from "express";
import type { Agent } from "supertest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";
import { AssignmentModel } from "../src/models/Assignment";

let app: Express;
let adminAgent: Agent;
let userAgent: Agent;
let traineeId: string;
let labId: string;

beforeAll(async () => {
  app = await setup();
  adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
  await createUser(adminAgent, "assign-plain-user", "plainuserpass1", "user");
  userAgent = await loginAs(app, "assign-plain-user", "plainuserpass1");

  const trainee = await createUser(adminAgent, "trainee-1", "traineepass1", "user");
  traineeId = trainee.id;

  const labRes = await adminAgent
    .post("/api/admin/labs")
    .send({ slug: "assign-lab", title: "Assign Lab" });
  labId = labRes.body._id;
});

afterAll(async () => {
  await teardown();
});

describe("admin assignments routes", () => {
  it("POST / stores an encrypted password, GET / returns it decrypted", async () => {
    const plain = "super-secret-rdp-pass";
    const createRes = await adminAgent.post("/api/admin/assignments").send({
      userId: traineeId,
      labId,
      rdpHost: "10.0.0.10",
      rdpUser: "trainee",
      rdpPassword: plain,
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.rdpPassword).toBe(plain);
    expect(createRes.body.user).toEqual({ id: traineeId, username: "trainee-1" });
    expect(createRes.body.lab).toMatchObject({ slug: "assign-lab", title: "Assign Lab" });

    const raw = await AssignmentModel.findById(createRes.body.id);
    expect(raw?.rdpPassword).not.toBe(plain);

    const listRes = await adminAgent.get("/api/admin/assignments");
    expect(listRes.status).toBe(200);
    const found = listRes.body.find((a: { id: string }) => a.id === createRes.body.id);
    expect(found.rdpPassword).toBe(plain);
  });

  it("POST / missing required fields -> 400", async () => {
    const res = await adminAgent.post("/api/admin/assignments").send({ userId: traineeId });
    expect(res.status).toBe(400);
  });

  it("POST / unknown user -> 400", async () => {
    const res = await adminAgent.post("/api/admin/assignments").send({
      userId: "0123456789abcdef01234567",
      labId,
      rdpHost: "10.0.0.11",
      rdpUser: "trainee",
      rdpPassword: "pw",
    });
    expect(res.status).toBe(400);
  });

  it("POST / unknown lab -> 404", async () => {
    const res = await adminAgent.post("/api/admin/assignments").send({
      userId: traineeId,
      labId: "0123456789abcdef01234567",
      rdpHost: "10.0.0.11",
      rdpUser: "trainee",
      rdpPassword: "pw",
    });
    expect(res.status).toBe(404);
  });

  it("POST / duplicate {userId,labId} -> 409", async () => {
    const res = await adminAgent.post("/api/admin/assignments").send({
      userId: traineeId,
      labId,
      rdpHost: "10.0.0.12",
      rdpUser: "trainee",
      rdpPassword: "pw2",
    });
    expect(res.status).toBe(409);
  });

  it("PATCH /:id re-encrypts a new password", async () => {
    const list = await adminAgent.get("/api/admin/assignments");
    const target = list.body.find((a: { user: { id: string } }) => a.user.id === traineeId);

    const newPlain = "rotated-secret-pass";
    const res = await adminAgent
      .patch(`/api/admin/assignments/${target.id}`)
      .send({ rdpPassword: newPlain });
    expect(res.status).toBe(200);
    expect(res.body.rdpPassword).toBe(newPlain);

    const raw = await AssignmentModel.findById(target.id);
    expect(raw?.rdpPassword).not.toBe(newPlain);
  });

  it("PATCH /:id 404s for unknown id", async () => {
    const res = await adminAgent
      .patch("/api/admin/assignments/0123456789abcdef01234567")
      .send({ rdpHost: "10.0.0.13" });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id removes the assignment", async () => {
    const list = await adminAgent.get("/api/admin/assignments");
    const target = list.body.find((a: { user: { id: string } }) => a.user.id === traineeId);

    const res = await adminAgent.delete(`/api/admin/assignments/${target.id}`);
    expect(res.status).toBe(204);

    const after = await adminAgent.get("/api/admin/assignments");
    expect(after.body.find((a: { id: string }) => a.id === target.id)).toBeUndefined();
  });

  it("DELETE /:id 404s for unknown id", async () => {
    const res = await adminAgent.delete("/api/admin/assignments/0123456789abcdef01234567");
    expect(res.status).toBe(404);
  });

  it("user role gets 403 on all assignment admin routes", async () => {
    expect((await userAgent.get("/api/admin/assignments")).status).toBe(403);
    expect(
      (
        await userAgent.post("/api/admin/assignments").send({
          userId: traineeId,
          labId,
          rdpHost: "x",
          rdpUser: "x",
          rdpPassword: "x",
        })
      ).status,
    ).toBe(403);
    expect(
      (await userAgent.patch("/api/admin/assignments/0123456789abcdef01234567").send({ rdpHost: "x" }))
        .status,
    ).toBe(403);
    expect((await userAgent.delete("/api/admin/assignments/0123456789abcdef01234567")).status).toBe(
      403,
    );
  });
});
