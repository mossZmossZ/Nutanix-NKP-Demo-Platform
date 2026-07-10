import { Schema, model, type InferSchemaType } from "mongoose";

// rdpPassword is stored ENCRYPTED at rest. This model never encrypts/decrypts itself —
// the service/route layer must call encryptSecret()/decryptSecret() (src/lib/crypto.ts)
// explicitly before writing/after reading. Treat the field as an opaque ciphertext string.
const machineSchema = new Schema(
  {
    name: { type: String, trim: true },
    rdpHost: { type: String, required: true, trim: true },
    rdpPort: { type: Number, default: 3389 },
    rdpUser: { type: String, required: true, trim: true },
    rdpPassword: { type: String, required: true },
    status: { type: String, enum: ["free", "assigned"], default: "free" },
  },
  { timestamps: true },
);

export type Machine = InferSchemaType<typeof machineSchema>;

export const MachineModel = model("Machine", machineSchema);
