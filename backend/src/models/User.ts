import { Schema, model, type InferSchemaType } from "mongoose";

export type Role = "admin" | "user";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    labPassword: { type: String },
    role: { type: String, enum: ["admin", "user"], required: true, default: "user" },
    lastSeen: { type: Date },
    preferences: { docFontSize: { type: Number } },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = model("User", userSchema);
