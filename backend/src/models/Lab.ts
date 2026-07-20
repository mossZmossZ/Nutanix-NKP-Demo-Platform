import { Schema, model, type InferSchemaType } from "mongoose";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type CredentialVarType = "endpoint" | "yaml" | "text";

// A credential GROUP is a named, ordered display section on a lab. Credentials
// reference a group by its _id; deleting a group only clears that reference (it
// never deletes credentials or their per-user values).
const credentialGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: true },
);

// A credential VARIABLE is the schema shared by every participant of a lab
// (label + render type). The per-user VALUE lives on the Assignment, keyed by
// this subdoc's _id. All values are plaintext (Phase 4e decision). groupId is
// an optional reference to a credentialGroup _id; absent = ungrouped ("Other").
const credentialVarSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ["endpoint", "yaml", "text"], required: true },
    groupId: { type: Schema.Types.ObjectId, default: null },
  },
  { _id: true },
);

// Guide CONTENT is NOT stored here — it lives as files under wiki/<slug>/ (see src/lib/wiki.ts).
const labSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    duration: { type: String, default: "" },
    order: { type: Number, default: 0 },
    credentialGroups: { type: [credentialGroupSchema], default: [] },
    credentialVars: { type: [credentialVarSchema], default: [] },
  },
  { timestamps: true },
);

export type Lab = InferSchemaType<typeof labSchema>;

export const LabModel = model("Lab", labSchema);
