import { SettingsModel } from "../models/Settings";

// Lab-document font size (px) is a shared scale: the platform default and each
// user's own preference use it. 16px is the design "body" size (= 100% zoom).
export const DOC_FONT_MIN = 12;
export const DOC_FONT_MAX = 24;

export function isValidDocFontSize(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= DOC_FONT_MIN && v <= DOC_FONT_MAX;
}

// The settings singleton. Upserts (with schema defaults) on first read so the
// document always exists — callers never handle a null row.
export function getSettings() {
  return SettingsModel.findOneAndUpdate(
    {},
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
