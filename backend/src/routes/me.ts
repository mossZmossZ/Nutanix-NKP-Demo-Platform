import { Router } from "express";
import { AssignmentModel } from "../models/Assignment";
import { LabModel } from "../models/Lab";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import { decryptSecret } from "../lib/crypto";
import { listPages, readPage } from "../lib/wiki";

export const meRouter = Router();

meRouter.use(requireAuth);

function labSummary(lab: { slug: string; title: string; summary: string; difficulty: string; duration: string }) {
  return {
    slug: lab.slug,
    title: lab.title,
    summary: lab.summary,
    difficulty: lab.difficulty,
    duration: lab.duration,
  };
}

meRouter.get("/labs", async (req: AuthedRequest, res) => {
  const assignments = await AssignmentModel.find({ userId: req.user!.id }).populate("labId");
  const withLab = assignments.filter((a) => a.labId) as unknown as Array<{
    id: string;
    labId: { slug: string; title: string; summary: string; difficulty: string; duration: string; order: number };
    completedPages: string[];
  }>;
  withLab.sort((a, b) => a.labId.order - b.labId.order || a.labId.title.localeCompare(b.labId.title));
  res.json(
    withLab.map((a) => ({
      id: a.id,
      lab: labSummary(a.labId),
      pageCount: listPages(a.labId.slug).length,
      completedCount: a.completedPages.length,
    })),
  );
});

meRouter.get("/labs/:slug", async (req: AuthedRequest, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  const assignment = await AssignmentModel.findOne({ userId: req.user!.id, labId: lab._id }).populate(
    "machineId",
  );
  if (!assignment) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  const machine = assignment.machineId as unknown as {
    rdpHost: string;
    rdpPort: number;
    rdpUser: string;
    rdpPassword: string;
  };
  res.json({
    id: assignment.id,
    lab: labSummary(lab),
    pages: listPages(lab.slug),
    completedPages: assignment.completedPages,
    connection: {
      rdpHost: machine.rdpHost,
      rdpPort: machine.rdpPort,
      rdpUser: machine.rdpUser,
      rdpPassword: decryptSecret(machine.rdpPassword),
    },
  });
});

meRouter.get("/labs/:slug/pages/:file", async (req: AuthedRequest, res) => {
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  const assignment = await AssignmentModel.exists({ userId: req.user!.id, labId: lab._id });
  if (!assignment) {
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

meRouter.post("/labs/:slug/progress", async (req: AuthedRequest, res) => {
  const { file, completed } = req.body ?? {};
  if (typeof file !== "string" || !file.trim()) {
    res.status(400).json({ error: "file is required" });
    return;
  }
  if (typeof completed !== "boolean") {
    res.status(400).json({ error: "completed must be a boolean" });
    return;
  }
  const lab = await LabModel.findOne({ slug: req.params.slug });
  if (!lab) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  const assignment = await AssignmentModel.findOne({ userId: req.user!.id, labId: lab._id });
  if (!assignment) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  if (completed) {
    if (!assignment.completedPages.includes(file)) {
      assignment.completedPages.push(file);
    }
  } else {
    assignment.completedPages = assignment.completedPages.filter((f) => f !== file);
  }
  await assignment.save();
  res.json({ completedPages: assignment.completedPages });
});
