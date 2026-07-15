import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { getActivityToday, getConcurrentUserCount } from "../../services/presence";
import { listRecentAudit } from "../../services/audit";

export const adminDashboardRouter = Router();

adminDashboardRouter.use(requireAuth, requireAdmin);

// Real-data feed for the admin dashboard: live presence + today's per-user
// active time + the recent audit trail. (Counts/health/enrollment land in 6c.)
adminDashboardRouter.get("/", async (_req, res) => {
  const [concurrentUsers, activeToday, recentActivity] = await Promise.all([
    getConcurrentUserCount(),
    getActivityToday(),
    listRecentAudit(),
  ]);
  res.json({ concurrentUsers, activeToday, recentActivity });
});
