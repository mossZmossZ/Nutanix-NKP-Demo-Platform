import type { Express } from "express";
import type { Agent } from "supertest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";

let app: Express;
let adminAgent: Agent;
let aliceAgent: Agent;
let bobAgent: Agent;
let labSlug: string;

beforeAll(async () => {
  app = await setup();
  adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);

  await createUser(adminAgent, "alice", "alicepassword1", "user");
  await createUser(adminAgent, "bob", "bobpassword1", "user");
  aliceAgent = await loginAs(app, "alice", "alicepassword1");
  bobAgent = await loginAs(app, "bob", "bobpassword1");

  const labRes = await adminAgent.post("/api/admin/labs").send({
    slug: "nkp-basics",
    title: "NKP Basics",
    summary: "Intro to NKP",
    difficulty: "Beginner",
    duration: "30m",
    order: 1,
  });
  if (labRes.status !== 201) throw new Error(`lab create failed: ${labRes.status} ${labRes.text}`);
  labSlug = labRes.body.slug;

  const machineRes = await adminAgent.post("/api/admin/machines").send({
    rdpHost: "10.0.0.5",
    rdpPort: 3389,
    rdpUser: "labuser",
    rdpPassword: "s3cretpass",
  });
  if (machineRes.status !== 201) throw new Error(`machine create failed: ${machineRes.status} ${machineRes.text}`);

  const alice = await aliceAgent.get("/api/auth/me");
  const assignRes = await adminAgent.post("/api/admin/assignments").send({
    userId: alice.body.id,
    labId: labRes.body._id,
    machineId: machineRes.body.id,
  });
  if (assignRes.status !== 201) throw new Error(`assignment create failed: ${assignRes.status} ${assignRes.text}`);
});

afterAll(async () => {
  await teardown();
});

describe("GET /api/me/labs", () => {
  it("returns only the caller's assignments (alice sees hers)", async () => {
    const res = await aliceAgent.get("/api/me/labs");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].lab.slug).toBe(labSlug);
    expect(res.body[0]).toHaveProperty("pageCount");
    expect(res.body[0]).toHaveProperty("completedCount", 0);
  });

  it("bob (no assignments) sees an empty list", async () => {
    const res = await bobAgent.get("/api/me/labs");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("never includes rdpPassword", async () => {
    const res = await aliceAgent.get("/api/me/labs");
    expect(res.status).toBe(200);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain("rdpPassword");
    expect(raw).not.toContain("s3cretpass");
  });

  it("unauthenticated request -> 401", async () => {
    const request = (await import("supertest")).default;
    const res = await request(app).get("/api/me/labs");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/me/labs/:slug", () => {
  it("returns alice's decrypted creds", async () => {
    const res = await aliceAgent.get(`/api/me/labs/${labSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.lab.slug).toBe(labSlug);
    expect(res.body.connection).toEqual({
      rdpHost: "10.0.0.5",
      rdpPort: 3389,
      rdpUser: "labuser",
      rdpPassword: "s3cretpass",
    });
    expect(Array.isArray(res.body.pages)).toBe(true);
    expect(res.body.completedPages).toEqual([]);
  });

  it("bob gets 404 for the same slug (ownership, not another user's data)", async () => {
    const res = await bobAgent.get(`/api/me/labs/${labSlug}`);
    expect(res.status).toBe(404);
  });

  it("a slug the user isn't assigned to -> 404", async () => {
    const res = await aliceAgent.get("/api/me/labs/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("unauthenticated request -> 401", async () => {
    const request = (await import("supertest")).default;
    const res = await request(app).get(`/api/me/labs/${labSlug}`);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/me/labs/:slug/pages/:file", () => {
  it("alice can read a page of her assigned lab", async () => {
    const res = await aliceAgent.get(`/api/me/labs/${labSlug}/pages/01-intro.md`);
    expect(res.status).toBe(200);
    expect(res.body.file).toBe("01-intro.md");
    expect(typeof res.body.content).toBe("string");
  });

  it("bob (not assigned) -> 404", async () => {
    const res = await bobAgent.get(`/api/me/labs/${labSlug}/pages/01-intro.md`);
    expect(res.status).toBe(404);
  });

  it("missing file -> 404", async () => {
    const res = await aliceAgent.get(`/api/me/labs/${labSlug}/pages/99-nope.md`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/me/labs/:slug/progress", () => {
  it("toggles a page in completedPages: add then remove, persists", async () => {
    const add = await aliceAgent
      .post(`/api/me/labs/${labSlug}/progress`)
      .send({ file: "01-intro.md", completed: true });
    expect(add.status).toBe(200);
    expect(add.body.completedPages).toEqual(["01-intro.md"]);

    const getAfterAdd = await aliceAgent.get(`/api/me/labs/${labSlug}`);
    expect(getAfterAdd.body.completedPages).toEqual(["01-intro.md"]);

    const addAgain = await aliceAgent
      .post(`/api/me/labs/${labSlug}/progress`)
      .send({ file: "01-intro.md", completed: true });
    expect(addAgain.body.completedPages).toEqual(["01-intro.md"]);

    const remove = await aliceAgent
      .post(`/api/me/labs/${labSlug}/progress`)
      .send({ file: "01-intro.md", completed: false });
    expect(remove.status).toBe(200);
    expect(remove.body.completedPages).toEqual([]);

    const getAfterRemove = await aliceAgent.get(`/api/me/labs/${labSlug}`);
    expect(getAfterRemove.body.completedPages).toEqual([]);
  });

  it("only affects the caller's own assignment (bob has none, 404)", async () => {
    const res = await bobAgent
      .post(`/api/me/labs/${labSlug}/progress`)
      .send({ file: "01-intro.md", completed: true });
    expect(res.status).toBe(404);
  });

  it("400 when file is missing/invalid", async () => {
    const res = await aliceAgent
      .post(`/api/me/labs/${labSlug}/progress`)
      .send({ completed: true });
    expect(res.status).toBe(400);
  });

  it("400 when completed is not boolean", async () => {
    const res = await aliceAgent
      .post(`/api/me/labs/${labSlug}/progress`)
      .send({ file: "01-intro.md", completed: "yes" });
    expect(res.status).toBe(400);
  });

  it("unauthenticated request -> 401", async () => {
    const request = (await import("supertest")).default;
    const res = await request(app)
      .post(`/api/me/labs/${labSlug}/progress`)
      .send({ file: "01-intro.md", completed: true });
    expect(res.status).toBe(401);
  });
});
