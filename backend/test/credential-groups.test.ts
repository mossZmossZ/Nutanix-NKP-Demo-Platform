import type { Express } from "express";
import type { Agent } from "supertest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";

let app: Express;
let adminAgent: Agent;
let userAgent: Agent;
let traineeAgent: Agent;

const SLUG = "groups-lab";

type Var = { _id: string; label: string; type: string; groupId: string | null };
type Group = { _id: string; name: string; order: number };
type SchemaResp = { credentialGroups: Group[]; credentialVars: Var[] };

let varId: string;
let assignmentId: string;

beforeAll(async () => {
  app = await setup();
  adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
  await createUser(adminAgent, "groups-plain-user", "plainuserpass1", "user");
  userAgent = await loginAs(app, "groups-plain-user", "plainuserpass1");

  const trainee = await createUser(adminAgent, "groups-trainee", "traineepass1", "user");
  traineeAgent = await loginAs(app, "groups-trainee", "traineepass1");
  const labRes = await adminAgent.post("/api/admin/labs").send({ slug: SLUG, title: "Groups Lab" });
  const labId = labRes.body._id;

  const machineRes = await adminAgent.post("/api/admin/machines").send({
    rdpHost: "10.0.0.10",
    rdpUser: "trainee",
    rdpPassword: "super-secret-rdp-pass",
  });

  const assignRes = await adminAgent.post("/api/admin/assignments").send({
    userId: trainee.id,
    labId,
    machineId: machineRes.body.id,
  });
  assignmentId = assignRes.body.id;

  // One credential var, with a per-user value we must never lose to any group op.
  const varsRes = await adminAgent
    .post(`/api/admin/labs/${SLUG}/credential-vars`)
    .send({ label: "kubeconfig", type: "text" });
  varId = varsRes.body[0]._id;

  await adminAgent
    .patch(`/api/admin/assignments/${assignmentId}/credentials`)
    .send({ values: { [varId]: "value-to-preserve" } });
});

afterAll(async () => {
  await teardown();
});

async function assignmentValue(): Promise<string | undefined> {
  const list = await adminAgent.get("/api/admin/assignments");
  const found = list.body.find((a: { id: string }) => a.id === assignmentId);
  return found?.credentialValues?.[varId];
}

describe("credential groups", () => {
  let groupId: string;

  it("POST creates a group and returns groups + vars", async () => {
    const res = await adminAgent
      .post(`/api/admin/labs/${SLUG}/credential-groups`)
      .send({ name: "Cluster access" });
    expect(res.status).toBe(201);
    const body = res.body as SchemaResp;
    expect(body.credentialGroups).toHaveLength(1);
    expect(body.credentialGroups[0].name).toBe("Cluster access");
    expect(body.credentialVars).toHaveLength(1);
    groupId = body.credentialGroups[0]._id;
  });

  it("POST rejects an empty name -> 400", async () => {
    const res = await adminAgent
      .post(`/api/admin/labs/${SLUG}/credential-groups`)
      .send({ name: "   " });
    expect(res.status).toBe(400);
  });

  it("PATCH moves a var into a group without dropping its value", async () => {
    const res = await adminAgent
      .patch(`/api/admin/labs/${SLUG}/credential-vars/${varId}`)
      .send({ groupId });
    expect(res.status).toBe(200);
    const moved = (res.body as Var[]).find((v) => v._id === varId);
    expect(moved?.groupId).toBe(groupId);
    expect(await assignmentValue()).toBe("value-to-preserve");
  });

  it("PATCH rejects a groupId from another lab -> 400", async () => {
    const res = await adminAgent
      .patch(`/api/admin/labs/${SLUG}/credential-vars/${varId}`)
      .send({ groupId: "0123456789abcdef01234567" });
    expect(res.status).toBe(400);
  });

  it("PATCH renames a group", async () => {
    const res = await adminAgent
      .patch(`/api/admin/labs/${SLUG}/credential-groups/${groupId}`)
      .send({ name: "Cluster" });
    expect(res.status).toBe(200);
    expect((res.body as SchemaResp).credentialGroups[0].name).toBe("Cluster");
  });

  it("me/labs returns groups and the credential's groupId to the participant", async () => {
    const res = await traineeAgent.get(`/api/me/labs/${SLUG}`);
    expect(res.status).toBe(200);
    expect(res.body.groups).toEqual([{ id: groupId, name: "Cluster" }]);
    const cred = res.body.credentials.find((c: { id: string }) => c.id === varId);
    expect(cred.groupId).toBe(groupId);
    expect(cred.value).toBe("value-to-preserve");
  });

  it("DELETE a group ungroups its vars but keeps the vars and their values", async () => {
    const res = await adminAgent.delete(`/api/admin/labs/${SLUG}/credential-groups/${groupId}`);
    expect(res.status).toBe(200);
    const body = res.body as SchemaResp;
    expect(body.credentialGroups).toHaveLength(0);
    expect(body.credentialVars).toHaveLength(1);
    expect(body.credentialVars[0].groupId).toBeNull();
    expect(await assignmentValue()).toBe("value-to-preserve");
  });

  it("rejects non-admin users -> 403", async () => {
    const res = await userAgent
      .post(`/api/admin/labs/${SLUG}/credential-groups`)
      .send({ name: "nope" });
    expect(res.status).toBe(403);
  });
});
