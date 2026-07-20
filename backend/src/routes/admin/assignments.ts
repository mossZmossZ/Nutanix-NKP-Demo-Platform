import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { AssignmentModel } from "../../models/Assignment";
import { UserModel } from "../../models/User";
import { LabModel } from "../../models/Lab";
import { MachineModel } from "../../models/Machine";
import { requireAuth, requireAdmin, type AuthedRequest } from "../../middleware/auth";
import { decryptSecret } from "../../lib/crypto";
import { recordAudit } from "../../services/audit";

export const adminAssignmentsRouter = Router();

adminAssignmentsRouter.use(requireAuth, requireAdmin);

// Placeholder for re-provisioning wiring in a later phase. No-op for now.
function resetMachine(_machineId: string): void {
  /* TODO: real re-provision wiring in a later phase */
}

function assignmentDTO(a: {
  id: string;
  // Populated userId is null when the user doc was deleted out from under the
  // assignment (orphaned data predating the user-delete guard).
  userId: { id: string; username: string } | string | null;
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
  credentialValues?: Map<string, string>;
}) {
  const user =
    a.userId && typeof a.userId === "object"
      ? { id: a.userId.id, username: a.userId.username }
      : a.userId;
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
    credentialValues: Object.fromEntries(a.credentialValues ?? []),
  };
}

adminAssignmentsRouter.get("/", async (_req, res) => {
  const assignments = await AssignmentModel.find()
    .populate("userId", "username")
    .populate("labId", "slug title")
    .populate("machineId");
  res.json(assignments.map((a) => assignmentDTO(a as never)));
});

adminAssignmentsRouter.post("/", async (req: AuthedRequest, res) => {
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
    const dto = assignmentDTO(populated as never);
    const who = dto.user && typeof dto.user === "object" ? dto.user.username : "";
    const what = typeof dto.lab === "object" ? dto.lab.title : "";
    await recordAudit({
      actorId: req.user!.id,
      action: "assignment.create",
      targetType: "assignment",
      targetLabel: `${who} → ${what}`,
    });
    res.status(201).json(dto);
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

// Save a participant's per-user credential values for their assigned lab. Keys
// are Lab.credentialVars subdoc _ids; the whole map is replaced with what the
// admin submits (blank fields drop out via the frontend).
adminAssignmentsRouter.patch("/:id/credentials", async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }
  const { values } = req.body ?? {};
  if (values === null || typeof values !== "object" || Array.isArray(values)) {
    res.status(400).json({ error: "values must be an object" });
    return;
  }
  const assignment = await AssignmentModel.findById(req.params.id);
  if (!assignment) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }
  assignment.credentialValues = new Map(
    Object.entries(values as Record<string, unknown>)
      .filter(([, v]) => typeof v === "string" && v.trim() !== "")
      .map(([k, v]) => [k, v as string]),
  );
  await assignment.save();
  res.json({ credentialValues: Object.fromEntries(assignment.credentialValues) });
});

adminAssignmentsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }
  const assignment = await AssignmentModel.findById(req.params.id)
    .populate("userId", "username")
    .populate("labId", "title");
  if (!assignment) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }
  const who = (assignment.userId as unknown as { username?: string })?.username ?? "";
  const what = (assignment.labId as unknown as { title?: string })?.title ?? "";
  const machineId = assignment.machineId;
  await assignment.deleteOne();
  resetMachine(machineId.toString());
  await MachineModel.findByIdAndUpdate(machineId, { $set: { status: "free" } });
  await recordAudit({
    actorId: req.user!.id,
    action: "assignment.revoke",
    targetType: "assignment",
    targetLabel: `${who} → ${what}`,
  });
  res.status(204).end();
});
