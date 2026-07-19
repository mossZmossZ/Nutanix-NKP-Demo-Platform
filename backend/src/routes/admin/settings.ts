import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { getSettings, isValidDocFontSize, DOC_FONT_MIN, DOC_FONT_MAX } from "../../services/settings";

export const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAuth, requireAdmin);

function publicSettings(s: { platformName: string; defaultDocFontSize: number; workshopCode: string }) {
  return {
    platformName: s.platformName,
    defaultDocFontSize: s.defaultDocFontSize,
    workshopCode: s.workshopCode ?? "",
  };
}

adminSettingsRouter.get("/", async (_req, res) => {
  const settings = await getSettings();
  res.json(publicSettings(settings as never));
});

adminSettingsRouter.patch("/", async (req, res) => {
  const { platformName, defaultDocFontSize, workshopCode } = req.body ?? {};
  const update: { platformName?: string; defaultDocFontSize?: number; workshopCode?: string } = {};

  if (platformName !== undefined) {
    if (typeof platformName !== "string" || !platformName.trim()) {
      res.status(400).json({ error: "platformName must be a non-empty string" });
      return;
    }
    update.platformName = platformName.trim();
  }

  if (defaultDocFontSize !== undefined) {
    if (!isValidDocFontSize(defaultDocFontSize)) {
      res.status(400).json({ error: `defaultDocFontSize must be an integer between ${DOC_FONT_MIN} and ${DOC_FONT_MAX}` });
      return;
    }
    update.defaultDocFontSize = defaultDocFontSize;
  }

  if (workshopCode !== undefined) {
    if (typeof workshopCode !== "string") {
      res.status(400).json({ error: "workshopCode must be a string" });
      return;
    }
    update.workshopCode = workshopCode.trim();
  }

  const settings = await getSettings();
  Object.assign(settings, update);
  await settings.save();
  res.json(publicSettings(settings as never));
});
