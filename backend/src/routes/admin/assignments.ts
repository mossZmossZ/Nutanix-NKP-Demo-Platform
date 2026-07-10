import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { AssignmentModel } from "../../models/Assignment";
import { UserModel } from "../../models/User";
import { LabModel } from "../../models/Lab";
import { MachineModel } from "../../models/Machine";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { decryptSecret } from "../../lib/crypto";

export const adminAssignmentsRouter = Router();

adminAssignmentsRouter.use(requireAuth, requireAdmin);

// Placeholder for re-provisioning wiring in a later phase. No-op for now.
function resetMachine(_machineId: string): void {
  /* TODO: real re-provision wiring in a later phase */
}

function assignmentDTO(a: {
  id: string;
  userId: { id: string; username: string } | string;
  labId: { id: string; slug: string; title: string } | string;
  machineId: {
    id: string;
    name?: string | null;
    rdpHost: string;
    rdpPort: number;
    rdpUser: string;
    rdpPassword: string;
    status: string;
  };
  completedPages: string[];
}) {
  const user =
    typeof a.userId === "object" ? { id: a.userId.id, username: a.userId.username } : a.userId;
  const lab =
    typeof a.labId === "object" ? { id: a.labId.id, slug: a.labId.slug, title: a.labId.title } : a.labId;
  const m = a.machineId;
  return {
    id: a.id,
    user,
    lab,
    machine: { id: m.id, name: m.name ?? undefined, status: m.status },
    rdpHost: m.rdpHost,
    rdpPort: m.rdpPort,
    rdpUser: m.rdpUser,
    rdpPassword: decryptSecret(m.rdpPassword),
    completedPages: a.completedPages,
  };
}

adminAssignmentsRouter.get("/", async (_req, res) => {
  const assignments = await AssignmentModel.find()
    .populate("userId", "username")
    .populate("labId", "slug title")
    .populate("machineId");
  res.json(assignments.map((a) => assignmentDTO(a as never)));
});

adminAssignmentsRouter.post("/", async (req, res) => {
  const { userId, labId, machineId } = req.body ?? {};
  if (typeof userId !== "string" || typeof labId !== "string" || typeof machineId !== "string") {
    res.status(400).json({ error: "userId, labId, machineId are required" });
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
  if (!isValidObjectId(machineId) || !(await MachineModel.exists({ _id: machineId }))) {
    res.status(404).json({ error: "machine not found" });
    return;
  }
  if (await AssignmentModel.exists({ userId, labId })) {
    res.status(409).json({ error: "assignment already exists for this user and lab" });
    return;
  }

  // Atomically claim the machine: only succeeds if it's still "free".
  const claimed = await MachineModel.findOneAndUpdate(
    { _id: machineId, status: "free" },
    { $set: { status: "assigned" } },
    { new: true },
  );
  if (!claimed) {
    res.status(409).json({ error: "machine not available" });
    return;
  }

  try {
    const assignment = await AssignmentModel.create({ userId, labId, machineId });
    const populated = await assignment.populate([
      { path: "userId", select: "username" },
      { path: "labId", select: "slug title" },
      { path: "machineId" },
    ]);
    res.status(201).json(assignmentDTO(populated as never));
  } catch (err: unknown) {
    // Create failed (e.g. duplicate) after we already claimed the machine — release it.
    await MachineModel.findByIdAndUpdate(machineId, { $set: { status: "free" } });
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      res.status(409).json({ error: "assignment already exists for this user and lab" });
      return;
    }
    throw err;
  }
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
  const machineId = assignment.machineId;
  await assignment.deleteOne();
  resetMachine(machineId.toString());
  await MachineModel.findByIdAndUpdate(machineId, { $set: { status: "free" } });
  res.status(204).end();
});
