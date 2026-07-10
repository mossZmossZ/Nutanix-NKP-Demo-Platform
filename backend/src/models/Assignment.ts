import { Schema, model, type InferSchemaType } from "mongoose";

// RDP creds live on the bound Machine (src/models/Machine.ts), not here. An assignment
// binds a user+lab to exactly one pool machine; the machine's own status flips
// free <-> assigned as assignments are created/revoked.
const assignmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    labId: { type: Schema.Types.ObjectId, ref: "Lab", required: true },
    machineId: { type: Schema.Types.ObjectId, ref: "Machine", required: true, unique: true },
    completedPages: { type: [String], default: [] },
  },
  { timestamps: true },
);

assignmentSchema.index({ userId: 1, labId: 1 }, { unique: true });

export type Assignment = InferSchemaType<typeof assignmentSchema>;

export const AssignmentModel = model("Assignment", assignmentSchema);
