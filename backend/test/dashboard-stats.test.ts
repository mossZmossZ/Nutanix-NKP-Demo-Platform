import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { setup, teardown } from "./helpers/harness";
import { MachineModel } from "../src/models/Machine";
import { LabModel } from "../src/models/Lab";
import { AssignmentModel } from "../src/models/Assignment";
import { getCounts, getMachineSummary, getLabsByEnrollment } from "../src/services/dashboard";

beforeAll(async () => {
  await setup();
});

afterAll(async () => {
  await teardown();
});

beforeEach(async () => {
  await Promise.all([
    MachineModel.deleteMany({}),
    LabModel.deleteMany({}),
    AssignmentModel.deleteMany({}),
  ]);
});

describe("getCounts", () => {
  it("counts users, machines, and labs", async () => {
    const before = await getCounts();
    await MachineModel.create({ rdpHost: "h1", rdpUser: "u", rdpPassword: "x" });
    await LabModel.create({ slug: "c-lab", title: "Counts Lab" });
    const after = await getCounts();
    expect(after.machines).toBe(before.machines + 1);
    expect(after.labs).toBe(before.labs + 1);
    expect(after.users).toBeGreaterThanOrEqual(1); // seeded admin
  });
});

describe("getMachineSummary", () => {
  it("tallies free/assigned and sums vCPU (missing vcpu counts as 0)", async () => {
    await MachineModel.create({ rdpHost: "a", rdpUser: "u", rdpPassword: "x", status: "free", vcpu: 8 });
    await MachineModel.create({ rdpHost: "b", rdpUser: "u", rdpPassword: "x", status: "assigned", vcpu: 4 });
    await MachineModel.create({ rdpHost: "c", rdpUser: "u", rdpPassword: "x", status: "free" }); // no vcpu
    const s = await getMachineSummary();
    expect(s.free).toBe(2);
    expect(s.assigned).toBe(1);
    expect(s.totalVcpu).toBe(12);
  });
});

describe("getLabsByEnrollment", () => {
  it("ranks labs by participant count, busiest first", async () => {
    const popular = await LabModel.create({ slug: "popular", title: "Popular" });
    const quiet = await LabModel.create({ slug: "quiet", title: "Quiet" });

    // 2 participants on popular, 1 on quiet — distinct machineIds (unique).
    await AssignmentModel.create({ userId: new mongoose.Types.ObjectId(), labId: popular._id, machineId: new mongoose.Types.ObjectId() });
    await AssignmentModel.create({ userId: new mongoose.Types.ObjectId(), labId: popular._id, machineId: new mongoose.Types.ObjectId() });
    await AssignmentModel.create({ userId: new mongoose.Types.ObjectId(), labId: quiet._id, machineId: new mongoose.Types.ObjectId() });

    const rows = await getLabsByEnrollment();
    expect(rows[0].slug).toBe("popular");
    expect(rows[0].participants).toBe(2);
    expect(rows.find((r) => r.slug === "quiet")?.participants).toBe(1);
    // No wiki pages in the test fixture dir -> pageCount 0 -> avgProgress 0.
    expect(rows[0].avgProgress).toBe(0);
  });

  it("reports zero participants for an unenrolled lab", async () => {
    await LabModel.create({ slug: "empty", title: "Empty" });
    const rows = await getLabsByEnrollment();
    expect(rows.find((r) => r.slug === "empty")?.participants).toBe(0);
  });
});
