import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { LabModel } from "../src/models/Lab";
import { AssignmentModel } from "../src/models/Assignment";

let mem: MongoMemoryServer;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  // Unique indexes build asynchronously; wait for them so the "enforces unique"
  // tests don't race the index build (otherwise duplicate inserts flakily succeed).
  await Promise.all([LabModel.init(), AssignmentModel.init()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe("Lab model", () => {
  it("requires slug and title", async () => {
    await expect(new LabModel({}).validate()).rejects.toThrow();
    await expect(new LabModel({ slug: "no-title" }).validate()).rejects.toThrow();
    await expect(new LabModel({ title: "No Slug" }).validate()).rejects.toThrow();
  });

  it("enforces unique slug", async () => {
    await LabModel.create({ slug: "unique-lab", title: "Unique Lab" });
    await expect(LabModel.create({ slug: "unique-lab", title: "Duplicate" })).rejects.toThrow();
  });

  it("applies field defaults", async () => {
    const lab = await LabModel.create({ slug: "defaults-lab", title: "Defaults Lab" });
    expect(lab.summary).toBe("");
    expect(lab.difficulty).toBe("Beginner");
    expect(lab.duration).toBe("");
    expect(lab.order).toBe(0);
  });
});

describe("Assignment model", () => {
  it("enforces unique {userId, labId}", async () => {
    const userId = new mongoose.Types.ObjectId();
    const labId = new mongoose.Types.ObjectId();
    const base = {
      userId,
      labId,
      rdpHost: "10.0.0.5",
      rdpUser: "trainee",
      rdpPassword: "encrypted-payload",
    };

    await AssignmentModel.create(base);
    await expect(AssignmentModel.create(base)).rejects.toThrow();
  });

  it("defaults completedPages to an empty array", async () => {
    const assignment = await AssignmentModel.create({
      userId: new mongoose.Types.ObjectId(),
      labId: new mongoose.Types.ObjectId(),
      rdpHost: "10.0.0.6",
      rdpUser: "trainee2",
      rdpPassword: "encrypted-payload-2",
    });

    expect(assignment.completedPages).toEqual([]);
    expect(assignment.rdpPort).toBe(3389);
  });
});
