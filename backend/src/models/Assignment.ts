import { Schema, model, type InferSchemaType } from "mongoose";

// rdpPassword is stored ENCRYPTED at rest. This model never encrypts/decrypts itself —
// the service/route layer must call encryptSecret()/decryptSecret() (src/lib/crypto.ts)
// explicitly before writing/after reading. Treat the field as an opaque ciphertext string.
const assignmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    labId: { type: Schema.Types.ObjectId, ref: "Lab", required: true },
    rdpHost: { type: String, required: true },
    rdpPort: { type: Number, default: 3389 },
    rdpUser: { type: String, required: true },
    rdpPassword: { type: String, required: true },
    completedPages: { type: [String], default: [] },
  },
  { timestamps: true },
);

assignmentSchema.index({ userId: 1, labId: 1 }, { unique: true });

export type Assignment = InferSchemaType<typeof assignmentSchema>;

export const AssignmentModel = model("Assignment", assignmentSchema);
