import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { getActivityToday, getConcurrentUserCount } from "../../services/presence";
import { listRecentAudit } from "../../services/audit";
import { getCounts, getMachineSummary, getLabsByEnrollment } from "../../services/dashboard";

export const adminDashboardRouter = Router();

adminDashboardRouter.use(requireAuth, requireAdmin);

// Real-data feed for the admin dashboard: live presence + today's per-user active
// time + recent audit trail + platform counts/machine pool/lab enrollment.
adminDashboardRouter.get("/", async (_req, res) => {
  const [concurrentUsers, activeToday, recentActivity, counts, machineSummary, labs] =
    await Promise.all([
      getConcurrentUserCount(),
      getActivityToday(),
      listRecentAudit(),
      getCounts(),
      getMachineSummary(),
      getLabsByEnrollment(5),
    ]);
  res.json({ concurrentUsers, activeToday, recentActivity, counts, machineSummary, labs });
});
