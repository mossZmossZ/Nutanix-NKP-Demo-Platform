import { UserModel } from "../models/User";
import { UserActivityModel } from "../models/UserActivity";
import { env } from "../config/env";

// A user counts as "online"/concurrent if seen within this window. Heartbeats
// fire ~30s, so 60s tolerates one missed ping.
export const PRESENCE_WINDOW_MS = 60_000;
// Cap the per-heartbeat delta so a sleep/closed-lid gap can't inflate active time.
export const HEARTBEAT_CAP_MS = 60_000;

/** YYYY-MM-DD for `date` in the configured workshop timezone. */
export function dayKey(date: Date = new Date(), tz: string = env.workshopTz): string {
  // en-CA renders ISO-style YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(date);
}

/**
 * Record a presence heartbeat: refresh `lastSeen`, and accumulate today's active
 * time by the (capped) gap since the last heartbeat. The first heartbeat of a day
 * only seeds `lastHeartbeatAt` (adds 0) — time accrues from the second ping on.
 */
export async function recordHeartbeat(userId: string, now: Date = new Date()): Promise<void> {
  await UserModel.updateOne({ _id: userId }, { $set: { lastSeen: now } });

  const key = dayKey(now);
  const existing = await UserActivityModel.findOne({ userId, dayKey: key });
  if (!existing) {
    await UserActivityModel.updateOne(
      { userId, dayKey: key },
      { $setOnInsert: { activeSeconds: 0 }, $set: { lastHeartbeatAt: now } },
      { upsert: true },
    );
    return;
  }
  const deltaMs = Math.min(now.getTime() - existing.lastHeartbeatAt.getTime(), HEARTBEAT_CAP_MS);
  const deltaSec = Math.max(0, Math.round(deltaMs / 1000));
  await UserActivityModel.updateOne(
    { _id: existing._id },
    { $inc: { activeSeconds: deltaSec }, $set: { lastHeartbeatAt: now } },
  );
}

/** Distinct users seen within the presence window. */
export async function getConcurrentUserCount(now: Date = new Date()): Promise<number> {
  return UserModel.countDocuments({ lastSeen: { $gte: new Date(now.getTime() - PRESENCE_WINDOW_MS) } });
}

export interface ActivityRow {
  userId: string;
  username: string;
  activeSeconds: number;
  lastSeen: Date | null;
  online: boolean;
}

/** Per-user active-time for today (WORKSHOP_TZ), busiest first. */
export async function getActivityToday(now: Date = new Date()): Promise<ActivityRow[]> {
  const rows = await UserActivityModel.find({ dayKey: dayKey(now) }).populate("userId");
  const cutoff = now.getTime() - PRESENCE_WINDOW_MS;
  return rows
    .filter((r) => r.userId) // drop rows whose user was deleted
    .map((r) => {
      const u = r.userId as unknown as { id: string; username: string; lastSeen?: Date };
      return {
        userId: u.id,
        username: u.username,
        activeSeconds: r.activeSeconds,
        lastSeen: u.lastSeen ?? null,
        online: !!u.lastSeen && u.lastSeen.getTime() >= cutoff,
      };
    })
    .sort((a, b) => b.activeSeconds - a.activeSeconds);
}
