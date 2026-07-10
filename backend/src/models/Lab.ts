import { Schema, model, type InferSchemaType } from "mongoose";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

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
  },
  { timestamps: true },
);

export type Lab = InferSchemaType<typeof labSchema>;

export const LabModel = model("Lab", labSchema);
