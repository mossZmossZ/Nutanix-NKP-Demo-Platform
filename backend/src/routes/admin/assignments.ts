import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { AssignmentModel } from "../../models/Assignment";
import { UserModel } from "../../models/User";
import { LabModel } from "../../models/Lab";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { encryptSecret, decryptSecret } from "../../lib/crypto";

export const adminAssignmentsRouter = Router();

adminAssignmentsRouter.use(requireAuth, requireAdmin);

function assignmentDTO(a: {
  id: string;
  userId: { id: string; username: string } | string;
  labId: { id: string; slug: string; title: string } | string;
  rdpHost: string;
  rdpPort: number;
  rdpUser: string;
  rdpPassword: string;
  completedPages: string[];
}) {
  const user =
    typeof a.userId === "object" ? { id: a.userId.id, username: a.userId.username } : a.userId;
  const lab =
    typeof a.labId === "object" ? { id: a.labId.id, slug: a.labId.slug, title: a.labId.title } : a.labId;
  return {
    id: a.id,
    user,
    lab,
    rdpHost: a.rdpHost,
    rdpPort: a.rdpPort,
    rdpUser: a.rdpUser,
    rdpPassword: decryptSecret(a.rdpPassword),
    completedPages: a.completedPages,
  };
}

adminAssignmentsRouter.get("/", async (_req, res) => {
  const assignments = await AssignmentModel.find()
    .populate("userId", "username")
    .populate("labId", "slug title");
  res.json(assignments.map((a) => assignmentDTO(a as never)));
});

adminAssignmentsRouter.post("/", async (req, res) => {
  const { userId, labId, rdpHost, rdpPort, rdpUser, rdpPassword } = req.body ?? {};
  if (
    typeof userId !== "string" ||
    typeof labId !== "string" ||
    typeof rdpHost !== "string" ||
    !rdpHost.trim() ||
    typeof rdpUser !== "string" ||
    !rdpUser.trim() ||
    typeof rdpPassword !== "string" ||
    !rdpPassword
  ) {
    res.status(400).json({ error: "userId, labId, rdpHost, rdpUser, rdpPassword are required" });
    return;
  }
  if (!isValidObjectId(userId) || !(await UserModel.exists({ _id: userId }))) {
    res.status(400).json({ error: "user not found" });
    return;
  }
  if (!isValidObjectId(labId) || !(await LabModel.exists({ _id: labId }))) {
    res.status(404).json({ error: "lab not found" });
    return;
  }
  if (await AssignmentModel.exists({ userId, labId })) {
    res.status(409).json({ error: "assignment already exists for this user and lab" });
    return;
  }
  try {
    const assignment = await AssignmentModel.create({
      userId,
      labId,
      rdpHost,
      rdpPort,
      rdpUser,
      rdpPassword: encryptSecret(rdpPassword),
    });
    const populated = await assignment.populate([
      { path: "userId", select: "username" },
      { path: "labId", select: "slug title" },
    ]);
    res.status(201).json(assignmentDTO(populated as never));
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      res.status(409).json({ error: "assignment already exists for this user and lab" });
      return;
    }
    throw err;
  }
});

adminAssignmentsRouter.patch("/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }
  const assignment = await AssignmentModel.findById(req.params.id);
  if (!assignment) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }
  const { rdpHost, rdpPort, rdpUser, rdpPassword } = req.body ?? {};
  if (rdpHost !== undefined) assignment.rdpHost = rdpHost;
  if (rdpPort !== undefined) assignment.rdpPort = rdpPort;
  if (rdpUser !== undefined) assignment.rdpUser = rdpUser;
  if (rdpPassword !== undefined) assignment.rdpPassword = encryptSecret(rdpPassword);
  await assignment.save();
  const populated = await assignment.populate([
    { path: "userId", select: "username" },
    { path: "labId", select: "slug title" },
  ]);
  res.json(assignmentDTO(populated as never));
});

adminAssignmentsRouter.delete("/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }
  const assignment = await AssignmentModel.findById(req.params.id);
  if (!assignment) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }
  await assignment.deleteOne();
  res.status(204).end();
});
