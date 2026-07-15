import { Schema, model, type InferSchemaType } from "mongoose";

export type Role = "admin" | "user";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], required: true, default: "user" },
    // Presence: refreshed by the heartbeat; drives the dashboard concurrent-user count.
    lastSeen: { type: Date },
    // Per-user UI prefs (Phase 6) — follows the user across devices. docFontSize
    // (px) overrides Settings.defaultDocFontSize for this user's lab guide.
    preferences: { docFontSize: { type: Number } },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = model("User", userSchema);
