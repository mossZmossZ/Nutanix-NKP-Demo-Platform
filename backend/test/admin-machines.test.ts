import type { Express } from "express";
import type { Agent } from "supertest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";
import { MachineModel } from "../src/models/Machine";

let app: Express;
let adminAgent: Agent;
let userAgent: Agent;

beforeAll(async () => {
  app = await setup();
  adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
  await createUser(adminAgent, "machine-plain-user", "plainuserpass1", "user");
  userAgent = await loginAs(app, "machine-plain-user", "plainuserpass1");
});

afterAll(async () => {
  await teardown();
});

describe("admin machines routes", () => {
  it("POST / stores an encrypted password, GET / returns it decrypted", async () => {
    const plain = "super-secret-rdp-pass";
    const createRes = await adminAgent.post("/api/admin/machines").send({
      name: "Machine 1",
      rdpHost: "10.0.1.10",
      rdpUser: "trainee",
      rdpPassword: plain,
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.rdpPassword).toBe(plain);
    expect(createRes.body.status).toBe("free");
    expect(createRes.body.rdpPort).toBe(3389);

    const raw = await MachineModel.findById(createRes.body.id);
    expect(raw?.rdpPassword).not.toBe(plain);

    const listRes = await adminAgent.get("/api/admin/machines");
    expect(listRes.status).toBe(200);
    const found = listRes.body.find((m: { id: string }) => m.id === createRes.body.id);
    expect(found.rdpPassword).toBe(plain);
  });

  it("POST / missing required fields -> 400", async () => {
    const res = await adminAgent.post("/api/admin/machines").send({ name: "no host" });
    expect(res.status).toBe(400);
  });

  it("PATCH /:id edits fields and re-encrypts a new password", async () => {
    const createRes = await adminAgent.post("/api/admin/machines").send({
      rdpHost: "10.0.1.11",
      rdpUser: "trainee2",
      rdpPassword: "initial-pass",
    });
    const id = createRes.body.id;

    const newPlain = "rotated-secret-pass";
    const res = await adminAgent.patch(`/api/admin/machines/${id}`).send({
      name: "Renamed",
      rdpHost: "10.0.1.12",
      rdpPassword: newPlain,
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed");
    expect(res.body.rdpHost).toBe("10.0.1.12");
    expect(res.body.rdpPassword).toBe(newPlain);

    const raw = await MachineModel.findById(id);
    expect(raw?.rdpPassword).not.toBe(newPlain);
  });

  it("PATCH /:id 404s for unknown id", async () => {
    const res = await adminAgent
      .patch("/api/admin/machines/0123456789abcdef01234567")
      .send({ rdpHost: "10.0.0.13" });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id removes a free machine", async () => {
    const createRes = await adminAgent.post("/api/admin/machines").send({
      rdpHost: "10.0.1.13",
      rdpUser: "trainee3",
      rdpPassword: "pw",
    });
    const id = createRes.body.id;

    const res = await adminAgent.delete(`/api/admin/machines/${id}`);
    expect(res.status).toBe(204);

    const after = await adminAgent.get("/api/admin/machines");
    expect(after.body.find((m: { id: string }) => m.id === id)).toBeUndefined();
  });

  it("DELETE /:id 409s for an assigned machine", async () => {
    const createRes = await adminAgent.post("/api/admin/machines").send({
      rdpHost: "10.0.1.14",
      rdpUser: "trainee4",
      rdpPassword: "pw",
    });
    const id = createRes.body.id;
    await MachineModel.findByIdAndUpdate(id, { status: "assigned" });

    const res = await adminAgent.delete(`/api/admin/machines/${id}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("machine is assigned");
  });

  it("DELETE /:id 404s for unknown id", async () => {
    const res = await adminAgent.delete("/api/admin/machines/0123456789abcdef01234567");
    expect(res.status).toBe(404);
  });

  it("user role gets 403 on all machine admin routes", async () => {
    expect((await userAgent.get("/api/admin/machines")).status).toBe(403);
    expect(
      (
        await userAgent.post("/api/admin/machines").send({
          rdpHost: "x",
          rdpUser: "x",
          rdpPassword: "x",
        })
      ).status,
    ).toBe(403);
    expect(
      (await userAgent.patch("/api/admin/machines/0123456789abcdef01234567").send({ rdpHost: "x" }))
        .status,
    ).toBe(403);
    expect((await userAgent.delete("/api/admin/machines/0123456789abcdef01234567")).status).toBe(
      403,
    );
  });
});
