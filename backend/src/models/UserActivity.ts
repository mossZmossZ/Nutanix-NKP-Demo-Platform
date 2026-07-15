import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Per-user, per-day accumulator of active (tab-visible) time. One document per
 * (userId, dayKey); the heartbeat `$inc`s `activeSeconds` by a capped delta.
 * `dayKey` is YYYY-MM-DD in WORKSHOP_TZ so "today" matches admin local midnight.
 */
const userActivitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dayKey: { type: String, required: true },
    activeSeconds: { type: Number, required: true, default: 0 },
    lastHeartbeatAt: { type: Date, required: true },
  },
  { timestamps: true },
);

userActivitySchema.index({ userId: 1, dayKey: 1 }, { unique: true });

export type UserActivity = InferSchemaType<typeof userActivitySchema>;

export const UserActivityModel = model("UserActivity", userActivitySchema);
