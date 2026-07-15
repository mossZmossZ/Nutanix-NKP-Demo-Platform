import { Schema, model, type InferSchemaType } from "mongoose";

// Single-document platform settings (Phase 6). Enforced as a singleton by the
// service layer (getSettings upserts the one row); no natural key is needed.
const settingsSchema = new Schema(
  {
    platformName: { type: String, required: true, default: "NKP Workshop", trim: true },
    defaultDocFontSize: { type: Number, required: true, default: 16 },
  },
  { timestamps: true },
);

export type Settings = InferSchemaType<typeof settingsSchema>;

export const SettingsModel = model("Settings", settingsSchema);
