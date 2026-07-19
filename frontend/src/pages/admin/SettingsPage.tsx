import { useEffect, useState, useMemo, type FormEvent, type ReactNode } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Settings,
  KeyRound,
  Building2,
  Type,
  Globe,
  Check,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FONT_SIZES = [12, 14, 16, 18, 20, 22, 24];

type SettingsData = { platformName: string; defaultDocFontSize: number; workshopCode: string };

// Repeated settings-card chrome — a gradient icon tile + title/description
// header over a bordered, softly-elevated card (matches the 6c dashboard look).
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <div className="flex items-start gap-3 border-b border-border/40 p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-iris-100 text-iris-600">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

export function SettingsPage() {
  const [savedSettings, setSavedSettings] = useState<SettingsData | null>(null);
  const [draftSettings, setDraftSettings] = useState<SettingsData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const hasUnsavedChanges = useMemo(() => {
    if (!savedSettings || !draftSettings) return false;
    return (
      savedSettings.platformName !== draftSettings.platformName ||
      savedSettings.defaultDocFontSize !== draftSettings.defaultDocFontSize ||
      savedSettings.workshopCode !== draftSettings.workshopCode
    );
  }, [savedSettings, draftSettings]);

  useEffect(() => {
    api<SettingsData>("/admin/settings")
      .then((data) => {
        setSavedSettings(data);
        setDraftSettings(data);
      })
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Failed to load settings"),
      );
  }, []);

  async function onSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!draftSettings) return;
    setSettingsSaving(true);
    try {
      const saved = await api<SettingsData>("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(draftSettings),
      });
      setSavedSettings(saved);
      setDraftSettings(saved);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save settings");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New password and confirmation do not match.");
      return;
    }
    setPwSaving(true);
    try {
      await api<void>("/me/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to change password";
      setPwError(msg);
      toast.error("Failed to change password", { description: msg });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <AppShell nav={adminNav} title="Settings">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-24">
        {/* Hero band */}
        <div className="overflow-hidden rounded-xl border border-border/40 shadow-sm">
          <div className="flex items-center gap-4 bg-navy-900 p-6 text-white">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Settings className="size-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="mt-1 text-sm text-navy-fg/80">
                Manage platform configuration and your admin account.
              </p>
            </div>
          </div>
        </div>

        {loadError && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700"
          >
            {loadError}
          </div>
        )}

        {/* Platform configuration (one form, shared save bar) */}
        <form id="settings-form" onSubmit={onSaveSettings} className="flex flex-col gap-6">
          <SectionCard
            icon={Building2}
            title="Platform identity"
            description="The display name shown in the app header and sidebar."
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-label text-muted-foreground">Display name</span>
              <Input
                value={draftSettings?.platformName ?? ""}
                disabled={!draftSettings}
                onChange={(e) =>
                  draftSettings &&
                  setDraftSettings({ ...draftSettings, platformName: e.target.value })
                }
                placeholder="NKP Workshop"
                aria-label="Platform display name"
                className="max-w-[24rem]"
              />
            </label>
          </SectionCard>

          <SectionCard
            icon={Type}
            title="Learner defaults"
            description="Default lab-guide appearance new participants inherit."
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
              <div className="flex w-full flex-col gap-1.5 sm:w-40">
                <label htmlFor="font-size" className="text-label text-muted-foreground">
                  Font size
                </label>
                <Select
                  value={draftSettings ? String(draftSettings.defaultDocFontSize) : undefined}
                  disabled={!draftSettings}
                  onValueChange={(v) =>
                    draftSettings &&
                    setDraftSettings({ ...draftSettings, defaultDocFontSize: Number(v) })
                  }
                >
                  <SelectTrigger id="font-size">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}px
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {draftSettings && (
                <div className="flex flex-1 flex-col justify-center rounded-lg border border-border/40 bg-muted/30 p-4">
                  <p className="mb-1 text-label text-muted-foreground">Preview</p>
                  <p
                    className="font-medium text-foreground transition-all duration-[var(--duration-base)] ease-standard"
                    style={{ fontSize: `${draftSettings.defaultDocFontSize}px`, lineHeight: 1.5 }}
                  >
                    The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Learners can override this with their own preference at any time.
            </p>
          </SectionCard>

          <SectionCard
            icon={ShieldCheck}
            title="Lab Find code"
            description="Shared code participants must enter to look up their credentials. Leave blank to disable credential lookup."
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-label text-muted-foreground">Workshop code</span>
              <Input
                value={draftSettings?.workshopCode ?? ""}
                disabled={!draftSettings}
                onChange={(e) =>
                  draftSettings &&
                  setDraftSettings({ ...draftSettings, workshopCode: e.target.value })
                }
                placeholder="e.g. nkp-july-2026"
                aria-label="Workshop code for credential lookup"
                className="max-w-[24rem] font-mono"
              />
            </label>
            <p className="mt-3 text-sm text-muted-foreground">
              Give this to the room. When empty, the Lab Find lookup is turned off entirely.
            </p>
          </SectionCard>

          <SectionCard
            icon={Globe}
            title="Web endpoint"
            description="Fixed at deploy time (nginx) — not editable here."
          >
            <div className="flex items-center gap-2">
              <Input
                className="max-w-[28rem] font-mono text-sm"
                value={window.location.origin}
                readOnly
                disabled
              />
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Read-only
              </span>
            </div>
          </SectionCard>
        </form>

        {/* Account security (separate form) */}
        <SectionCard
          icon={KeyRound}
          title="Change password"
          description="Update your admin account credentials."
        >
          <form onSubmit={onChangePassword} className="space-y-4">
            <label className="flex flex-col gap-1.5 sm:max-w-[24rem]">
              <span className="text-label text-muted-foreground">Current password</span>
              <Input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>

            <div className="grid gap-4 sm:max-w-[24rem] sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-label text-muted-foreground">New password</span>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-label text-muted-foreground">Confirm password</span>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            </div>

            {newPassword.length > 0 && (
              <div className="space-y-1 sm:max-w-[24rem]">
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-[var(--duration-base)] ease-standard",
                      newPassword.length < 8
                        ? "w-1/3 bg-destructive"
                        : newPassword.length < 12
                          ? "w-2/3 bg-warning"
                          : "w-full bg-success",
                    )}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {newPassword.length < 8
                    ? "Too short — minimum 8 characters"
                    : newPassword.length < 12
                      ? "Moderate — consider adding more characters"
                      : "Strong password"}
                </p>
              </div>
            )}

            {pwError && (
              <p role="alert" className="text-sm text-destructive">
                {pwError}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
            >
              {pwSaving ? "Changing…" : "Change password"}
            </Button>
          </form>
        </SectionCard>

        {/* Sticky save bar — slides in only when there are unsaved changes */}
        {hasUnsavedChanges && (
          <div className="pointer-events-none sticky bottom-4 z-20 flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-[var(--duration-base)]">
            <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-border bg-surface/95 py-2 pl-5 pr-2 shadow-lg backdrop-blur">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-2 shrink-0 rounded-full bg-warning" />
                Unsaved changes
              </span>
              <Button
                type="submit"
                form="settings-form"
                variant="primary"
                className="rounded-full"
                disabled={settingsSaving}
              >
                {settingsSaving ? (
                  "Saving…"
                ) : (
                  <>
                    <Check className="size-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
