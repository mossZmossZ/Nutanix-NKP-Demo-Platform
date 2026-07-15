import { AuditEventModel } from "../models/AuditEvent";
import { UserModel } from "../models/User";

export interface AuditInput {
  actorId?: string;
  /** If omitted, looked up from `actorId` and denormalized onto the event. */
  actorUsername?: string;
  action: string;
  targetType?: string;
  targetLabel?: string;
}

/**
 * Append one audit event. Callers pass `actorId` (from the JWT); the actor's
 * username is resolved once and stored on the event so the feed survives the
 * user's deletion.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  let actorUsername = input.actorUsername;
  if (!actorUsername && input.actorId) {
    const actor = await UserModel.findById(input.actorId).select("username");
    actorUsername = actor?.username;
  }
  await AuditEventModel.create({
    actorId: input.actorId,
    actorUsername: actorUsername ?? "system",
    action: input.action,
    targetType: input.targetType,
    targetLabel: input.targetLabel,
  });
}

export interface AuditRow {
  id: string;
  actorUsername: string;
  action: string;
  targetType?: string;
  targetLabel?: string;
  createdAt: Date;
}

/** Most recent audit events, newest first. */
export async function listRecentAudit(limit = 20): Promise<AuditRow[]> {
  const events = await AuditEventModel.find().sort({ createdAt: -1 }).limit(limit);
  return events.map((e) => {
    const doc = e as unknown as { createdAt: Date };
    return {
      id: e.id,
      actorUsername: e.actorUsername,
      action: e.action,
      targetType: e.targetType ?? undefined,
      targetLabel: e.targetLabel ?? undefined,
      createdAt: doc.createdAt,
    };
  });
}
