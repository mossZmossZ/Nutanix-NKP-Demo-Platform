import type { Express } from "express";
import type { Agent } from "supertest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";
import { MachineModel } from "../src/models/Machine";
import { UserModel } from "../src/models/User";

let app: Express;
let adminAgent: Agent;
let userAgent: Agent;
let traineeId: string;
let labId: string;

async function createMachine(agent: Agent, overrides: Record<string, unknown> = {}) {
  const res = await agent.post("/api/admin/machines").send({
    rdpHost: "10.0.0.10",
    rdpUser: "trainee",
    rdpPassword: "super-secret-rdp-pass",
    ...overrides,
  });
  if (res.status !== 201) throw new Error(`createMachine failed: ${res.status} ${res.text}`);
  return res.body as { id: string; status: string };
}

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
  it("POST / binds a free machine, GET / returns its decrypted creds; machine flips to assigned", async () => {
    const machine = await createMachine(adminAgent);

    const createRes = await adminAgent.post("/api/admin/assignments").send({
      userId: traineeId,
      labId,
      machineId: machine.id,
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.rdpPassword).toBe("super-secret-rdp-pass");
    expect(createRes.body.user).toEqual({ id: traineeId, username: "trainee-1" });
    expect(createRes.body.lab).toMatchObject({ slug: "assign-lab", title: "Assign Lab" });
    expect(createRes.body.machine).toMatchObject({ id: machine.id, status: "assigned" });

    const raw = await MachineModel.findById(machine.id);
    expect(raw?.status).toBe("assigned");

    const listRes = await adminAgent.get("/api/admin/assignments");
    expect(listRes.status).toBe(200);
    const found = listRes.body.find((a: { id: string }) => a.id === createRes.body.id);
    expect(found.rdpPassword).toBe("super-secret-rdp-pass");
  });

  it("POST / missing required fields -> 400", async () => {
    const res = await adminAgent.post("/api/admin/assignments").send({ userId: traineeId });
    expect(res.status).toBe(400);
  });

  it("POST / unknown user -> 400", async () => {
    const machine = await createMachine(adminAgent, { rdpHost: "10.0.0.20" });
    const res = await adminAgent.post("/api/admin/assignments").send({
      userId: "0123456789abcdef01234567",
      labId,
      machineId: machine.id,
    });
    expect(res.status).toBe(400);
  });

  it("POST / unknown lab -> 404", async () => {
    const machine = await createMachine(adminAgent, { rdpHost: "10.0.0.21" });
    const res = await adminAgent.post("/api/admin/assignments").send({
      userId: traineeId,
      labId: "0123456789abcdef01234567",
      machineId: machine.id,
    });
    expect(res.status).toBe(404);
  });

  it("POST / unknown machine -> 404", async () => {
    const labRes = await adminAgent
      .post("/api/admin/labs")
      .send({ slug: "assign-lab-unknown-machine", title: "Unknown Machine Lab" });
    const res = await adminAgent.post("/api/admin/assignments").send({
      userId: traineeId,
      labId: labRes.body._id,
      machineId: "0123456789abcdef01234567",
    });
    expect(res.status).toBe(404);
  });

  it("POST / duplicate {userId,labId} -> 409, and does not leave the new machine stuck assigned", async () => {
    const secondMachine = await createMachine(adminAgent, { rdpHost: "10.0.0.22" });

    const res = await adminAgent.post("/api/admin/assignments").send({
      userId: traineeId,
      labId,
      machineId: secondMachine.id,
    });
    expect(res.status).toBe(409);

    const raw = await MachineModel.findById(secondMachine.id);
    expect(raw?.status).toBe("free");
  });

  it("POST / assigning an already-assigned machine -> 409 machine not available", async () => {
    // traineeId is already bound (via `labId`) to a machine from the first test.
    // Reuse that same machine but for a different (userId, labId) pair so the
    // dup-check doesn't fire first — this must hit the machine-claim path.
    const assignedList = await adminAgent.get("/api/admin/assignments");
    const existing = assignedList.body.find((a: { user: { id: string } }) => a.user.id === traineeId);
    const takenMachineId = existing.machine.id;

    const otherLabRes = await adminAgent
      .post("/api/admin/labs")
      .send({ slug: "assign-lab-2", title: "Assign Lab 2" });

    const res = await adminAgent.post("/api/admin/assignments").send({
      userId: traineeId,
      labId: otherLabRes.body._id,
      machineId: takenMachineId,
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("machine not available");
  });

  it("DELETE /:id removes the assignment and returns the machine to the pool", async () => {
    const list = await adminAgent.get("/api/admin/assignments");
    const target = list.body.find((a: { user: { id: string } }) => a.user.id === traineeId);
    const machineId = target.machine.id;

    const res = await adminAgent.delete(`/api/admin/assignments/${target.id}`);
    expect(res.status).toBe(204);

    const after = await adminAgent.get("/api/admin/assignments");
    expect(after.body.find((a: { id: string }) => a.id === target.id)).toBeUndefined();

    const machine = await MachineModel.findById(machineId);
    expect(machine?.status).toBe("free");
  });

  it("DELETE /:id 404s for unknown id", async () => {
    const res = await adminAgent.delete("/api/admin/assignments/0123456789abcdef01234567");
    expect(res.status).toBe(404);
  });

  it("DELETE /api/admin/users/:id with an active assignment -> 409; succeeds after revoke", async () => {
    const doomed = await createUser(adminAgent, "doomed-user", "doomedpass1", "user");
    const machine = await createMachine(adminAgent, { rdpHost: "10.0.0.30" });
    const labRes = await adminAgent
      .post("/api/admin/labs")
      .send({ slug: "orphan-lab", title: "Orphan Lab" });
    const createRes = await adminAgent.post("/api/admin/assignments").send({
      userId: doomed.id,
      labId: labRes.body._id,
      machineId: machine.id,
    });
    expect(createRes.status).toBe(201);

    const del = await adminAgent.delete(`/api/admin/users/${doomed.id}`);
    expect(del.status).toBe(409);
    expect(del.body.error).toMatch(/assignment/);

    await adminAgent.delete(`/api/admin/assignments/${createRes.body.id}`);
    expect((await adminAgent.delete(`/api/admin/users/${doomed.id}`)).status).toBe(204);
  });

  it("GET / tolerates an assignment whose user doc is gone (user: null)", async () => {
    const ghost = await createUser(adminAgent, "ghost-user", "ghostpass1", "user");
    const machine = await createMachine(adminAgent, { rdpHost: "10.0.0.31" });
    const labRes = await adminAgent
      .post("/api/admin/labs")
      .send({ slug: "ghost-lab", title: "Ghost Lab" });
    const createRes = await adminAgent.post("/api/admin/assignments").send({
      userId: ghost.id,
      labId: labRes.body._id,
      machineId: machine.id,
    });
    expect(createRes.status).toBe(201);
    // Simulate pre-guard orphaned data: remove the user doc directly.
    await UserModel.deleteOne({ _id: ghost.id });

    const list = await adminAgent.get("/api/admin/assignments");
    expect(list.status).toBe(200);
    const found = list.body.find((a: { id: string }) => a.id === createRes.body.id);
    expect(found.user).toBeNull();

    // The orphan can still be revoked, freeing the machine.
    const revoke = await adminAgent.delete(`/api/admin/assignments/${createRes.body.id}`);
    expect(revoke.status).toBe(204);
    expect((await MachineModel.findById(machine.id))?.status).toBe("free");
  });

  it("user role gets 403 on all assignment admin routes", async () => {
    expect((await userAgent.get("/api/admin/assignments")).status).toBe(403);
    expect(
      (
        await userAgent.post("/api/admin/assignments").send({
          userId: traineeId,
          labId,
          machineId: "0123456789abcdef01234567",
        })
      ).status,
    ).toBe(403);
    expect((await userAgent.delete("/api/admin/assignments/0123456789abcdef01234567")).status).toBe(
      403,
    );
  });
});
