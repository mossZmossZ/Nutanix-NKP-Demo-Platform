import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Building2, Type, Globe, Minus, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

const FONT_MIN = 12;
const FONT_MAX = 24;
const FONT_STEP = 2;

type Settings = { platformName: string; defaultDocFontSize: number };

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof KeyRound;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border">
        <div className="flex items-center gap-sm">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-h4">{title}</CardTitle>
            <CardDescription className="mt-xxs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-lg">{children}</CardContent>
    </Card>
  );
}

export function SettingsPage() {
  // Account & Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  // Platform + Learner Defaults (Settings singleton)
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    api<Settings>("/admin/settings")
      .then(setSettings)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load settings"));
  }, []);

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
      toast.success("Password changed", { description: "Your password has been updated." });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to change password";
      setPwError(msg);
      toast.error("Failed to change password", { description: msg });
    } finally {
      setPwSaving(false);
    }
  }

  async function onSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSettingsSaving(true);
    try {
      const saved = await api<Settings>("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      setSettings(saved);
      toast.success("Settings saved", { description: "Platform settings have been updated." });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save settings";
      toast.error("Failed to save settings", { description: msg });
    } finally {
      setSettingsSaving(false);
    }
  }

  function setFontSize(next: number) {
    if (!settings) return;
    const clamped = Math.min(FONT_MAX, Math.max(FONT_MIN, next));
    setSettings({ ...settings, defaultDocFontSize: clamped });
  }

  return (
    <AppShell nav={adminNav} title="Settings">
      <div className="mx-auto flex max-w-3xl flex-col gap-lg">
        {/* Header */}
        <div className="flex items-start gap-md">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground">Platform Settings</h2>
            <p className="mt-xxs text-body-sm text-muted-foreground">
              Manage your account, platform identity, and learner defaults.
            </p>
          </div>
        </div>

        {/* Account & Security — admin changes their own password */}
        <SectionCard
          icon={KeyRound}
          title="Account & Security"
          description="Change your own password."
        >
          <form onSubmit={onChangePassword} className="grid gap-md sm:grid-cols-2">
            <label className="flex flex-col gap-xs sm:col-span-2 sm:max-w-sm">
              <span className="text-label text-muted-foreground">Current password</span>
              <Input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">New password</span>
              <Input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Confirm new password</span>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            {pwError && (
              <p role="alert" className="text-body-sm text-destructive sm:col-span-2">
                {pwError}
              </p>
            )}
            <div className="sm:col-span-2">
              <Button
                type="submit"
                variant="primary"
                disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
              >
                {pwSaving ? "Changing…" : "Change password"}
              </Button>
            </div>
          </form>
        </SectionCard>

        {loadError && (
          <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-md text-body-sm font-medium text-destructive">
            {loadError}
          </p>
        )}

        {/* Platform Identity + Learner Defaults — one form, one PATCH */}
        <form onSubmit={onSaveSettings} className="flex flex-col gap-lg">
          <SectionCard
            icon={Building2}
            title="Platform Identity"
            description="The display name shown in the app header."
          >
            <label className="flex flex-col gap-xs sm:max-w-sm">
              <span className="text-label text-muted-foreground">Platform display name</span>
              <Input
                value={settings?.platformName ?? ""}
                disabled={!settings}
                onChange={(e) => settings && setSettings({ ...settings, platformName: e.target.value })}
                placeholder="NKP Workshop"
              />
            </label>
          </SectionCard>

          <SectionCard
            icon={Type}
            title="Learner Defaults"
            description="Default lab-guide font size new participants inherit."
          >
            <div className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Default document font size</span>
              <div className="flex items-center gap-sm">
                <div className="flex items-center rounded-md border border-border" role="group" aria-label="Default font size">
                  <button
                    type="button"
                    aria-label="Decrease default font size"
                    disabled={!settings || settings.defaultDocFontSize <= FONT_MIN}
                    onClick={() => settings && setFontSize(settings.defaultDocFontSize - FONT_STEP)}
                    className="rounded-l-md px-sm py-xs text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="min-w-16 border-x border-border px-sm py-xs text-center font-mono text-body-sm tabular-nums text-foreground">
                    {settings ? `${settings.defaultDocFontSize}px` : "—"}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase default font size"
                    disabled={!settings || settings.defaultDocFontSize >= FONT_MAX}
                    onClick={() => settings && setFontSize(settings.defaultDocFontSize + FONT_STEP)}
                    className="rounded-r-md px-sm py-xs text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <span
                  className="text-muted-foreground"
                  style={{ fontSize: settings ? `${settings.defaultDocFontSize}px` : undefined }}
                >
                  Preview
                </span>
              </div>
            </div>
          </SectionCard>

          <div>
            <Button type="submit" variant="primary" disabled={!settings || settingsSaving}>
              {settingsSaving ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </form>

        {/* Web Application Endpoint — read-only, set at deploy time */}
        <SectionCard
          icon={Globe}
          title="Web Application Endpoint"
          description="Where the platform is served. Configured at deploy time (nginx)."
        >
          <label className="flex flex-col gap-xs sm:max-w-md">
            <span className="flex items-center gap-xs text-label text-muted-foreground">
              Endpoint
              <span className="rounded-sm border border-border px-xxs text-label normal-case text-muted-foreground">
                Read-only
              </span>
            </span>
            <Input className="font-mono" value={window.location.origin} readOnly disabled />
            <span className="text-body-sm text-muted-foreground">
              Fixed after nginx deployment — not editable here.
            </span>
          </label>
        </SectionCard>
      </div>
    </AppShell>
  );
}
