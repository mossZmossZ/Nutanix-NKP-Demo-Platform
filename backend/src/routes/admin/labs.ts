import { Router } from "express";
import { LabModel } from "../../models/Lab";
import { AssignmentModel } from "../../models/Assignment";
import { requireAuth, requireAdmin, type AuthedRequest } from "../../middleware/auth";
import { recordAudit } from "../../services/audit";
import { scaffoldLab, listPages, readPage, writePage, createPage, deletePage, removeLab } from "../../lib/wiki";
import { serializeLab, parseLabArchive, ArchiveError } from "../../lib/labArchive";

export const adminLabsRouter = Router();

adminLabsRouter.use(requireAuth, requireAdmin);

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

adminLabsRouter.get("/", async (_req, res) => {
  const labs = await LabModel.find().sort({ order: 1, title: 1 });
  res.json(
    labs.map((lab) => ({ ...lab.toObject(), pageCount: listPages(lab.slug).length })),
  );
});

adminLabsRouter.post("/", async (req: AuthedRequest, res) => {
  const { slug, title, summary, difficulty, duration, order } = req.body ?? {};
  if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) {
    res.status(400).json({ error: "slug is required and must be kebab-case" });
    return;
  }
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  if (await LabModel.exists({ slug })) {
    res.status(409).json({ error: "slug already exists" });
    return;
  }
  const lab = await LabModel.create({ slug, title, summary, difficulty, duration, order });
  scaffoldLab(slug);
  await recordAudit({ actorId: req.user!.id, action: "lab.create", targetType: "lab", targetLabel: lab.title });
  res.status(201).json(lab);
});

// Import a lab from a single-file .md archive (see lib/labArchive.ts). Without
// mode=overwrite an existing slug is a 409 (the response carries assignment
// counts so the UI can warn); with it, pages + metadata are replaced and
// credentialVar _ids are reused so per-user values survive — vars dropped from
// the file have their values unset from the lab's assignments.
adminLabsRouter.post("/import", async (req: AuthedRequest, res) => {
  const { content, mode } = req.body ?? {};
  if (typeof content !== "string") {
    res.status(400).json({ error: "content must be a string" });
    return;
  }
  let parsed;
  try {
    parsed = parseLabArchive(content);
  } catch (err) {
    res.status(400).json({ error: err instanceof ArchiveError ? err.message : "invalid lab file" });
    return;
  }
  const { meta, pages } = parsed;
  const existing = await LabModel.findOne({ slug: meta.slug });

  if (existing && mode !== "overwrite") {
    const assignmentCount = await AssignmentModel.countDocuments({ labId: existing._id });
    res.status(409).json({
      error: `lab "${meta.slug}" already exists`,
      slug: meta.slug,
      hasAssignments: assignmentCount > 0,
      assignmentCount,
    });
    return;
  }

  const vars = meta.credentialVars ?? [];

  if (existing) {
    const keptIds = new Set(vars.filter((v) => v._id).map((v) => v._id));
    const removedIds = existing.credentialVars
      .map((v) => String(v._id))
      .filter((id) => !keptIds.has(id));

    existing.title = meta.title;
    existing.summary = meta.summary ?? "";
    existing.difficulty = (meta.difficulty ?? "Beginner") as typeof existing.difficulty;
    existing.duration = meta.duration ?? "";
    existing.order = meta.order ?? 0;
    existing.set("credentialVars", vars);
    await existing.save();

    removeLab(existing.slug);
    for (const page of pages) writePage(existing.slug, page.file, page.content);

    if (removedIds.length > 0) {
      const unset = Object.fromEntries(removedIds.map((id) => [`credentialValues.${id}`, ""]));
      await AssignmentModel.updateMany({ labId: existing._id }, { $unset: unset });
    }

    await recordAudit({ actorId: req.user!.id, action: "lab.import", targetType: "lab", targetLabel: existing.title });
    res.json({ ...existing.toObject(), pageCount: pages.length, mode: "overwrite" });
    return;
  }

  const lab = await LabModel.create({
    slug: meta.slug,
    title: meta.title,
    summary: meta.summary,
    difficulty: meta.difficulty,
    duration: meta.duration,
    order: meta.order,
    credentialVars: vars,
  });
  removeLab(lab.slug);
  for (const page of pages) writePage(lab.slug, page.file, page.content);
  await recordAudit({ actorId: req.user!.id, action: "lab.import", targetType: "lab", targetLabel: lab.title });
  res.status(201).json({ ...lab.toObject(), pageCount: pages.length, mode: "create" });
});

adminLabsRouter.get("/:slug", async (req, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  res.json({ ...lab.toObject(), pages: listPages(lab.slug) });
});

// Export a lab as a single downloadable .md archive (see lib/labArchive.ts).
adminLabsRouter.get("/:slug/export", async (req, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  const pages = listPages(lab.slug).map((p) => ({ file: p.file, content: readPage(lab.slug, p.file) }));
  const doc = serializeLab(
    {
      slug: lab.slug,
      title: lab.title,
      summary: lab.summary,
      difficulty: lab.difficulty,
      duration: lab.duration,
      order: lab.order,
      credentialVars: lab.credentialVars.map((v) => ({
        _id: String(v._id),
        label: v.label,
        type: v.type,
      })),
    },
    pages,
  );
  res.type("text/markdown");
  res.setHeader("Content-Disposition", `attachment; filename="${lab.slug}.md"`);
  res.send(doc);
});

adminLabsRouter.patch("/:slug", async (req, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  const { title, summary, difficulty, duration, order } = req.body ?? {};
  if (title !== undefined) lab.title = title;
  if (summary !== undefined) lab.summary = summary;
  if (difficulty !== undefined) lab.difficulty = difficulty;
  if (duration !== undefined) lab.duration = duration;
  if (order !== undefined) lab.order = order;
  await lab.save();
  res.json(lab);
});

adminLabsRouter.delete("/:slug", async (req, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  if (await AssignmentModel.exists({ labId: lab._id })) {
    res.status(409).json({ error: "lab has active assignments" });
    return;
  }
  await lab.deleteOne();
  removeLab(lab.slug);
  res.status(204).end();
});

adminLabsRouter.get("/:slug/pages/:file", async (req, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  try {
    const content = readPage(lab.slug, req.params.file);
    res.json({ file: req.params.file, content });
  } catch {
    res.status(404).json({ error: "page not found" });
  }
});

const CREDENTIAL_VAR_TYPES = ["endpoint", "yaml", "text"] as const;

// Add a credential variable to a lab's schema. Edits are add + remove (no
// PATCH) — matches the admin schema editor, keeps subdoc _ids stable so
// existing per-user values never re-key.
adminLabsRouter.post("/:slug/credential-vars", async (req, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  const { label, type } = req.body ?? {};
  if (typeof label !== "string" || !label.trim()) {
    res.status(400).json({ error: "label is required" });
    return;
  }
  if (!CREDENTIAL_VAR_TYPES.includes(type)) {
    res.status(400).json({ error: "type must be endpoint, yaml, or text" });
    return;
  }
  lab.credentialVars.push({ label: label.trim(), type });
  await lab.save();
  res.status(201).json(lab.credentialVars);
});

// Remove a variable and unset its value from every assignment on this lab so
// no orphaned per-user data lingers.
adminLabsRouter.delete("/:slug/credential-vars/:varId", async (req, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  const variable = lab.credentialVars.id(req.params.varId);
  if (!variable) {
    res.status(404).json({ error: "variable not found" });
    return;
  }
  variable.deleteOne();
  await lab.save();
  await AssignmentModel.updateMany(
    { labId: lab._id },
    { $unset: { [`credentialValues.${req.params.varId}`]: "" } },
  );
  res.json(lab.credentialVars);
});

adminLabsRouter.put("/:slug/pages/:file", async (req, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  const { content } = req.body ?? {};
  if (typeof content !== "string") {
    res.status(400).json({ error: "content must be a string" });
    return;
  }
  writePage(lab.slug, req.params.file, content);
  res.json({ file: req.params.file, content });
});

adminLabsRouter.post("/:slug/pages", async (req, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  const { title } = req.body ?? {};
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const page = createPage(lab.slug, title.trim());
  res.status(201).json(page);
});

// Delete a guide page. A lab must keep at least one page, so the final page
// can't be removed (409) — an empty guide breaks the participant lab view.
adminLabsRouter.delete("/:slug/pages/:file", async (req, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  const pages = listPages(lab.slug);
  if (!pages.some((p) => p.file === req.params.file)) {
    res.status(404).json({ error: "page not found" });
    return;
  }
  if (pages.length <= 1) {
    res.status(409).json({ error: "a lab must keep at least one page" });
    return;
  }
  deletePage(lab.slug, req.params.file);
  res.status(204).end();
});
