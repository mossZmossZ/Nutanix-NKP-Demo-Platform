import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Append-only admin activity log. `actorUsername` is denormalized at write time
 * so the feed survives the actor being deleted (the whole point of an audit log).
 * `action` is a dotted verb (e.g. "user.create", "assignment.revoke"); the
 * frontend maps it to an icon + phrasing.
 */
const auditEventSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorUsername: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String },
    targetLabel: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditEventSchema.index({ createdAt: -1 });

export type AuditEvent = InferSchemaType<typeof auditEventSchema>;

export const AuditEventModel = model("AuditEvent", auditEventSchema);
