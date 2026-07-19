import { Router } from "express";
import { UserModel } from "../models/User";
import { getSettings } from "../services/settings";
import { safeDecryptSecret } from "../lib/crypto";
import { recordAudit } from "../services/audit";
import { rateLimit } from "../lib/rateLimit";

export const labFindRouter = Router();

// Public, unauthenticated endpoint — cap attempts per client IP to blunt harvesting.
// The workshop-code gate (fail-closed, generic 404) is the real defense; this only
// blunts brute-force. Kept generous because a whole workshop room commonly shares one
// NAT/public IP, so a tight cap would false-block legit concurrent lookups.
// Requires `trust proxy` (app.ts) so req.ip is the real client, not the nginx proxy.
const labFindLimiter = rateLimit({
  windowMs: 10 * 60_000,
  max: 60,
  message: "Too many attempts. Try again in a few minutes.",
});

// One generic message for every failure (wrong code, no user, no password) so
// the endpoint never confirms which emails have accounts.
const NOT_FOUND = "No matching account found. Check your email and workshop code.";

labFindRouter.post("/lab-find", labFindLimiter, async (req, res) => {
  const { email, code } = req.body ?? {};

  if (typeof email !== "string" || !email.trim()) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  if (typeof code !== "string" || !code.trim()) {
    res.status(400).json({ error: "Workshop code is required" });
    return;
  }

  const settings = await getSettings();
  const workshopCode = (settings.workshopCode ?? "").trim();

  // Fail closed: with no code configured, the lookup is disabled entirely.
  if (!workshopCode || code.trim() !== workshopCode) {
    res.status(404).json({ error: NOT_FOUND });
    return;
  }

  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (!user || !user.labPassword) {
    res.status(404).json({ error: NOT_FOUND });
    return;
  }

  await recordAudit({
    actorUsername: user.username,
    action: "lab-find.lookup",
    targetType: "user",
    targetLabel: user.username,
  });

  res.json({ username: user.username, password: safeDecryptSecret(user.labPassword) });
});
