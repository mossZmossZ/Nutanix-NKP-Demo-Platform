import type { Express } from "express";
import type { Agent } from "supertest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";
import { parseLabArchive, serializeLab } from "../src/lib/labArchive";

let app: Express;
let adminAgent: Agent;
let userAgent: Agent;

beforeAll(async () => {
  app = await setup();
  adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
  await createUser(adminAgent, "archive-plain-user", "plainuserpass1", "user");
  userAgent = await loginAs(app, "archive-plain-user", "plainuserpass1");
});

afterAll(async () => {
  await teardown();
});

describe("labArchive serializer", () => {
  it("round-trips metadata, credentialVars, and pages", () => {
    const meta = {
      slug: "round-trip",
      title: "Round Trip",
      summary: "s",
      difficulty: "Advanced",
      duration: "30 min",
      order: 3,
      credentialVars: [{ _id: "665f0000000000000000000a", label: "Endpoint", type: "endpoint" }],
    };
    const pages = [
      { file: "01-intro.md", content: "# Intro\n\nHello.\n" },
      { file: "02-next.md", content: "# Next\n\nWorld.\n" },
    ];
    const parsed = parseLabArchive(serializeLab(meta, pages));
    expect(parsed.meta).toMatchObject(meta);
    expect(parsed.pages).toEqual(pages);
  });

  it("rejects a file with no frontmatter", () => {
    expect(() => parseLabArchive("# just markdown")).toThrow(/frontmatter/);
  });

  it("rejects a file with no page markers", () => {
    expect(() => parseLabArchive("---\nslug: x\ntitle: X\n---\n\n# no markers")).toThrow(/pages/);
  });
});

describe("admin labs import/export routes", () => {
  it("exports a lab as a downloadable .md archive", async () => {
    await adminAgent.post("/api/admin/labs").send({ slug: "export-me", title: "Export Me" });
    const res = await adminAgent.get("/api/admin/labs/export-me/export");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/markdown");
    expect(res.headers["content-disposition"]).toContain('filename="export-me.md"');
    expect(res.text).toContain("slug: export-me");
    expect(res.text).toContain("<!-- page: 01-intro.md -->");
  });

  it("export 404s for an unknown lab", async () => {
    expect((await adminAgent.get("/api/admin/labs/nope/export")).status).toBe(404);
  });

  it("imports a new lab (create) with its pages", async () => {
    const archive = serializeLab(
      { slug: "imported-lab", title: "Imported Lab", order: 2 },
      [
        { file: "01-intro.md", content: "# Intro\n\nImported.\n" },
        { file: "02-step.md", content: "# Step\n\nMore.\n" },
      ],
    );
    const res = await adminAgent.post("/api/admin/labs/import").send({ content: archive });
    expect(res.status).toBe(201);
    expect(res.body.mode).toBe("create");
    expect(res.body.pageCount).toBe(2);

    const detail = await adminAgent.get("/api/admin/labs/imported-lab");
    expect(detail.body.pages.map((p: { file: string }) => p.file)).toEqual([
      "01-intro.md",
      "02-step.md",
    ]);
    const page = await adminAgent.get("/api/admin/labs/imported-lab/pages/02-step.md");
    expect(page.body.content).toBe("# Step\n\nMore.\n");
  });

  it("import (create) on an existing slug -> 409 with assignment info", async () => {
    const archive = serializeLab({ slug: "export-me", title: "Dup" }, [
      { file: "01-intro.md", content: "# x\n" },
    ]);
    const res = await adminAgent.post("/api/admin/labs/import").send({ content: archive });
    expect(res.status).toBe(409);
    expect(res.body.slug).toBe("export-me");
    expect(res.body.hasAssignments).toBe(false);
    expect(res.body.assignmentCount).toBe(0);
  });

  it("import (overwrite) replaces pages and preserves per-user credential values, unsetting removed vars", async () => {
    // Lab with two credential variables.
    await adminAgent.post("/api/admin/labs").send({ slug: "creds-lab", title: "Creds Lab" });
    await adminAgent
      .post("/api/admin/labs/creds-lab/credential-vars")
      .send({ label: "Endpoint", type: "endpoint" });
    await adminAgent
      .post("/api/admin/labs/creds-lab/credential-vars")
      .send({ label: "Token", type: "text" });
    const lab = (await adminAgent.get("/api/admin/labs/creds-lab")).body;
    const [endpointVar, tokenVar] = lab.credentialVars;

    // Assign a participant and set both credential values.
    const target = await createUser(adminAgent, "creds-user", "credspass123", "user");
    const machine = (
      await adminAgent
        .post("/api/admin/machines")
        .send({ rdpHost: "10.0.0.5", rdpUser: "t", rdpPassword: "p" })
    ).body;
    const assignment = (
      await adminAgent
        .post("/api/admin/assignments")
        .send({ userId: target.id, labId: lab._id, machineId: machine.id })
    ).body;
    await adminAgent.patch(`/api/admin/assignments/${assignment.id}/credentials`).send({
      values: { [endpointVar._id]: "https://api.example", [tokenVar._id]: "secret-token" },
    });

    // Export, drop the Token var from the file, re-import as overwrite.
    const exported = (await adminAgent.get("/api/admin/labs/creds-lab/export")).text;
    const trimmed = serializeLab(
      {
        slug: "creds-lab",
        title: "Creds Lab (v2)",
        credentialVars: [{ _id: endpointVar._id, label: "Endpoint", type: "endpoint" }],
      },
      parseLabArchive(exported).pages,
    );
    const res = await adminAgent
      .post("/api/admin/labs/import")
      .send({ content: trimmed, mode: "overwrite" });
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("overwrite");
    expect(res.body.title).toBe("Creds Lab (v2)");

    // Endpoint value survives; Token value was unset with its variable.
    const after = (await adminAgent.get("/api/admin/assignments")).body.find(
      (a: { id: string }) => a.id === assignment.id,
    );
    expect(after.credentialValues[endpointVar._id]).toBe("https://api.example");
    expect(after.credentialValues[tokenVar._id]).toBeUndefined();
  });

  it("import rejects a malformed file -> 400", async () => {
    const res = await adminAgent
      .post("/api/admin/labs/import")
      .send({ content: "not a lab file" });
    expect(res.status).toBe(400);
  });

  it("import rejects non-string content -> 400", async () => {
    const res = await adminAgent.post("/api/admin/labs/import").send({ content: 123 });
    expect(res.status).toBe(400);
  });

  it("user role gets 403 on import/export", async () => {
    expect((await userAgent.get("/api/admin/labs/export-me/export")).status).toBe(403);
    expect(
      (await userAgent.post("/api/admin/labs/import").send({ content: "x" })).status,
    ).toBe(403);
  });
});
