import type { Express } from "express";
import type { Agent } from "supertest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";

let app: Express;
let adminAgent: Agent;
let userAgent: Agent;

beforeAll(async () => {
  app = await setup();
  adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
  await createUser(adminAgent, "labs-plain-user", "plainuserpass1", "user");
  userAgent = await loginAs(app, "labs-plain-user", "plainuserpass1");
});

afterAll(async () => {
  await teardown();
});

describe("admin labs routes", () => {
  it("POST / creates a lab and scaffolds the wiki dir", async () => {
    const res = await adminAgent
      .post("/api/admin/labs")
      .send({ slug: "intro-nkp", title: "Intro to NKP" });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe("intro-nkp");

    const detail = await adminAgent.get("/api/admin/labs/intro-nkp");
    expect(detail.status).toBe(200);
    expect(detail.body.pages).toHaveLength(1);
    expect(detail.body.pages[0].file).toBe("01-intro.md");
  });

  it("POST / rejects a non-kebab-case slug -> 400", async () => {
    const res = await adminAgent
      .post("/api/admin/labs")
      .send({ slug: "Not_Kebab Case", title: "Bad Slug" });
    expect(res.status).toBe(400);
  });

  it("POST / rejects a missing title -> 400", async () => {
    const res = await adminAgent.post("/api/admin/labs").send({ slug: "no-title-lab" });
    expect(res.status).toBe(400);
  });

  it("POST / duplicate slug -> 409", async () => {
    const res = await adminAgent
      .post("/api/admin/labs")
      .send({ slug: "intro-nkp", title: "Dup" });
    expect(res.status).toBe(409);
  });

  it("GET / lists labs sorted, with pageCount", async () => {
    const res = await adminAgent.get("/api/admin/labs");
    expect(res.status).toBe(200);
    const lab = res.body.find((l: { slug: string }) => l.slug === "intro-nkp");
    expect(lab.pageCount).toBe(1);
  });

  it("GET /:slug 404s for unknown lab", async () => {
    const res = await adminAgent.get("/api/admin/labs/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("PATCH /:slug updates metadata, ignores slug immutability", async () => {
    const res = await adminAgent
      .patch("/api/admin/labs/intro-nkp")
      .send({ title: "Intro to NKP (updated)", difficulty: "Advanced", order: 5 });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Intro to NKP (updated)");
    expect(res.body.difficulty).toBe("Advanced");
    expect(res.body.slug).toBe("intro-nkp");
  });

  it("PATCH /:slug 404s for unknown lab", async () => {
    const res = await adminAgent.patch("/api/admin/labs/nope").send({ title: "x" });
    expect(res.status).toBe(404);
  });

  it("GET and PUT page content", async () => {
    const getRes = await adminAgent.get("/api/admin/labs/intro-nkp/pages/01-intro.md");
    expect(getRes.status).toBe(200);
    expect(getRes.body.content).toContain("# Introduction");

    const putRes = await adminAgent
      .put("/api/admin/labs/intro-nkp/pages/01-intro.md")
      .send({ content: "# Introduction\n\nUpdated content." });
    expect(putRes.status).toBe(200);

    const getAgain = await adminAgent.get("/api/admin/labs/intro-nkp/pages/01-intro.md");
    expect(getAgain.body.content).toBe("# Introduction\n\nUpdated content.");
  });

  it("PUT page rejects non-string content -> 400", async () => {
    const res = await adminAgent
      .put("/api/admin/labs/intro-nkp/pages/01-intro.md")
      .send({ content: 123 });
    expect(res.status).toBe(400);
  });

  it("GET page 404s for missing page file", async () => {
    const res = await adminAgent.get("/api/admin/labs/intro-nkp/pages/99-missing.md");
    expect(res.status).toBe(404);
  });

  it("GET/PUT page 404s for unknown lab", async () => {
    const res = await adminAgent.get("/api/admin/labs/nope/pages/01-intro.md");
    expect(res.status).toBe(404);
  });

  it("DELETE /:slug blocked by existing assignment -> 409, then allowed once unassigned", async () => {
    const target = await createUser(adminAgent, "labs-del-user", "delpassword1", "user");
    const machineRes = await adminAgent.post("/api/admin/machines").send({
      rdpHost: "10.0.0.9",
      rdpUser: "trainee",
      rdpPassword: "s3cret-pass",
    });
    expect(machineRes.status).toBe(201);
    const assignRes = await adminAgent.post("/api/admin/assignments").send({
      userId: target.id,
      labId: (await adminAgent.get("/api/admin/labs/intro-nkp")).body._id,
      machineId: machineRes.body.id,
    });
    expect(assignRes.status).toBe(201);

    const blocked = await adminAgent.delete("/api/admin/labs/intro-nkp");
    expect(blocked.status).toBe(409);

    await adminAgent.delete(`/api/admin/assignments/${assignRes.body.id}`);

    const allowed = await adminAgent.delete("/api/admin/labs/intro-nkp");
    expect(allowed.status).toBe(204);

    const gone = await adminAgent.get("/api/admin/labs/intro-nkp");
    expect(gone.status).toBe(404);
  });

  it("DELETE /:slug 404s for unknown lab", async () => {
    const res = await adminAgent.delete("/api/admin/labs/nope");
    expect(res.status).toBe(404);
  });

  it("user role gets 403 on all lab admin routes", async () => {
    expect((await userAgent.get("/api/admin/labs")).status).toBe(403);
    expect((await userAgent.post("/api/admin/labs").send({ slug: "x", title: "x" })).status).toBe(403);
    expect((await userAgent.get("/api/admin/labs/intro-nkp")).status).toBe(403);
    expect((await userAgent.patch("/api/admin/labs/intro-nkp").send({ title: "x" })).status).toBe(403);
    expect((await userAgent.delete("/api/admin/labs/intro-nkp")).status).toBe(403);
    expect((await userAgent.get("/api/admin/labs/intro-nkp/pages/01-intro.md")).status).toBe(403);
    expect(
      (await userAgent.put("/api/admin/labs/intro-nkp/pages/01-intro.md").send({ content: "x" }))
        .status,
    ).toBe(403);
  });
});
