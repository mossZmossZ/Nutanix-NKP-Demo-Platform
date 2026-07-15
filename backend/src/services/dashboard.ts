import { UserModel } from "../models/User";
import { MachineModel } from "../models/Machine";
import { LabModel } from "../models/Lab";
import { AssignmentModel } from "../models/Assignment";
import { listPages } from "../lib/wiki";

export interface Counts {
  users: number;
  machines: number;
  labs: number;
}

export async function getCounts(): Promise<Counts> {
  const [users, machines, labs] = await Promise.all([
    UserModel.countDocuments({}),
    MachineModel.countDocuments({}),
    LabModel.countDocuments({}),
  ]);
  return { users, machines, labs };
}

export interface MachineSummary {
  free: number;
  assigned: number;
  totalVcpu: number;
}

/** Persisted pool state (instant). Live UP/DOWN health lives on the Machines page. */
export async function getMachineSummary(): Promise<MachineSummary> {
  const [free, assigned, vcpuAgg] = await Promise.all([
    MachineModel.countDocuments({ status: "free" }),
    MachineModel.countDocuments({ status: "assigned" }),
    MachineModel.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: { $ifNull: ["$vcpu", 0] } } } },
    ]),
  ]);
  return { free, assigned, totalVcpu: vcpuAgg[0]?.total ?? 0 };
}

export interface LabEnrollment {
  slug: string;
  title: string;
  participants: number;
  avgProgress: number; // 0..1 — mean of (completedPages / pageCount) across participants
}

/** Labs ranked by enrollment, with mean guide progress. Busiest first. */
export async function getLabsByEnrollment(limit = 5): Promise<LabEnrollment[]> {
  const labs = await LabModel.find().sort({ order: 1, title: 1 });
  const agg = await AssignmentModel.aggregate<{ _id: unknown; participants: number; completed: number }>([
    { $group: { _id: "$labId", participants: { $sum: 1 }, completed: { $sum: { $size: "$completedPages" } } } },
  ]);
  const byLab = new Map(agg.map((a) => [String(a._id), a]));

  return labs
    .map((lab) => {
      const a = byLab.get(String(lab._id));
      const participants = a?.participants ?? 0;
      const pageCount = listPages(lab.slug).length;
      const avgProgress =
        participants > 0 && pageCount > 0 ? a!.completed / (participants * pageCount) : 0;
      return { slug: lab.slug, title: lab.title, participants, avgProgress };
    })
    .sort((x, y) => y.participants - x.participants || x.title.localeCompare(y.title))
    .slice(0, limit);
}
