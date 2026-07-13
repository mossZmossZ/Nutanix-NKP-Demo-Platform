import { Router } from "express";
import { LabModel } from "../../models/Lab";
import { AssignmentModel } from "../../models/Assignment";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { scaffoldLab, listPages, readPage, writePage, removeLab } from "../../lib/wiki";

export const adminLabsRouter = Router();

adminLabsRouter.use(requireAuth, requireAdmin);

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

adminLabsRouter.get("/", async (_req, res) => {
  const labs = await LabModel.find().sort({ order: 1, title: 1 });
  res.json(
    labs.map((lab) => ({ ...lab.toObject(), pageCount: listPages(lab.slug).length })),
  );
});

adminLabsRouter.post("/", async (req, res) => {
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
  res.status(201).json(lab);
});

adminLabsRouter.get("/:slug", async (req, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  res.json({ ...lab.toObject(), pages: listPages(lab.slug) });
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
