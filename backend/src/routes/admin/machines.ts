import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { MachineModel } from "../../models/Machine";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { encryptSecret, decryptSecret } from "../../lib/crypto";

export const adminMachinesRouter = Router();

adminMachinesRouter.use(requireAuth, requireAdmin);

function machineDTO(m: {
  id: string;
  name?: string | null;
  rdpHost: string;
  rdpPort: number;
  rdpUser: string;
  rdpPassword: string;
  status: string;
}) {
  return {
    id: m.id,
    name: m.name ?? undefined,
    rdpHost: m.rdpHost,
    rdpPort: m.rdpPort,
    rdpUser: m.rdpUser,
    rdpPassword: decryptSecret(m.rdpPassword),
    status: m.status,
  };
}

adminMachinesRouter.get("/", async (_req, res) => {
  const machines = await MachineModel.find().sort({ status: 1, rdpHost: 1 });
  res.json(machines.map((m) => machineDTO(m as never)));
});

adminMachinesRouter.post("/", async (req, res) => {
  const { name, rdpHost, rdpPort, rdpUser, rdpPassword } = req.body ?? {};
  if (
    typeof rdpHost !== "string" ||
    !rdpHost.trim() ||
    typeof rdpUser !== "string" ||
    !rdpUser.trim() ||
    typeof rdpPassword !== "string" ||
    !rdpPassword
  ) {
    res.status(400).json({ error: "rdpHost, rdpUser, rdpPassword are required" });
    return;
  }
  const machine = await MachineModel.create({
    name,
    rdpHost,
    rdpPort,
    rdpUser,
    rdpPassword: encryptSecret(rdpPassword),
    status: "free",
  });
  res.status(201).json(machineDTO(machine as never));
});

adminMachinesRouter.patch("/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "machine not found" });
    return;
  }
  const machine = await MachineModel.findById(req.params.id);
  if (!machine) {
    res.status(404).json({ error: "machine not found" });
    return;
  }
  const { name, rdpHost, rdpPort, rdpUser, rdpPassword } = req.body ?? {};
  if (name !== undefined) machine.name = name;
  if (rdpHost !== undefined) machine.rdpHost = rdpHost;
  if (rdpPort !== undefined) machine.rdpPort = rdpPort;
  if (rdpUser !== undefined) machine.rdpUser = rdpUser;
  if (rdpPassword !== undefined) machine.rdpPassword = encryptSecret(rdpPassword);
  await machine.save();
  res.json(machineDTO(machine as never));
});

adminMachinesRouter.delete("/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "machine not found" });
    return;
  }
  const machine = await MachineModel.findById(req.params.id);
  if (!machine) {
    res.status(404).json({ error: "machine not found" });
    return;
  }
  if (machine.status === "assigned") {
    res.status(409).json({ error: "machine is assigned" });
    return;
  }
  await machine.deleteOne();
  res.status(204).end();
});
