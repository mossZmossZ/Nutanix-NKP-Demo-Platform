import { useEffect, useState, useMemo, type FormEvent } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Settings, KeyRound, Building2, Type, Globe } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FONT_SIZES = [12, 14, 16, 18, 20, 22, 24];

type SettingsData = { platformName: string; defaultDocFontSize: number };

const sections = [
  { id: "general", label: "General", icon: Settings },
  { id: "security", label: "Password", icon: KeyRound },
] as const;

type SectionId = (typeof sections)[number]["id"];

export function SettingsPage() {
  const [active, setActive] = useState<SectionId>("general");

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
      savedSettings.defaultDocFontSize !== draftSettings.defaultDocFontSize
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
      <div className="mx-auto max-w-3xl">
        <div className="mb-lg flex items-center gap-md">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="size-5" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground">Settings</h2>
            <p className="mt-xxs text-body-sm text-muted-foreground">
              Manage platform configuration and your account.
            </p>
          </div>
        </div>

        {loadError && (
          <div
            role="alert"
            className="mb-lg rounded-md border border-destructive/20 bg-destructive/10 p-md text-body-sm font-medium text-destructive"
          >
            {loadError}
          </div>
        )}

        {/* ── Settings shell — sidebar nav + content panel ──────── */}
        <div className="flex rounded-lg border border-border bg-card shadow-sm">
          {/* Sidebar nav */}
          <nav className="flex w-52 shrink-0 flex-col border-r border-border bg-muted/30 p-sm" aria-label="Settings sections">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id as SectionId)}
                className={cn(
                  "flex items-center gap-xs rounded-md px-sm py-xs text-left text-body-sm font-medium outline-none transition-colors duration-[var(--duration-fast)] ease-standard",
                  active === id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                )}
                aria-current={active === id ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {id === "general" && hasUnsavedChanges && (
                  <span className="size-2 shrink-0 rounded-full bg-warning" aria-label="Unsaved changes" />
                )}
              </button>
            ))}
          </nav>

          {/* Content panel */}
          <div className="flex min-w-0 flex-1 flex-col">
            {active === "general" && (
              <form onSubmit={onSaveSettings} className="flex flex-1 flex-col">
                <div className="flex-1 space-y-0 p-lg">
                  {/* Platform Identity */}
                  <section className="space-y-md">
                    <div className="flex items-center gap-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Building2 className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-h4 text-foreground">Platform Identity</h3>
                        <p className="mt-xxs text-body-sm text-muted-foreground">
                          The display name shown in the app header.
                        </p>
                      </div>
                    </div>
                    <Input
                      value={draftSettings?.platformName ?? ""}
                      disabled={!draftSettings}
                      onChange={(e) =>
                        draftSettings &&
                        setDraftSettings({ ...draftSettings, platformName: e.target.value })
                      }
                      placeholder="NKP Workshop"
                      aria-label="Platform display name"
                      className="max-w-sm"
                    />
                  </section>

                  <Separator className="my-lg" />

                  {/* Learner Defaults */}
                  <section className="space-y-md">
                    <div className="flex items-center gap-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Type className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-h4 text-foreground">Learner Defaults</h3>
                        <p className="mt-xxs text-body-sm text-muted-foreground">
                          Default lab-guide appearance new participants inherit.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-md sm:flex-row sm:items-start">
                      <div className="space-y-xs sm:w-40">
                        <label className="text-label text-muted-foreground" htmlFor="font-size">
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
                        <div className="flex-1 rounded-md border border-border bg-muted/40 p-md">
                          <p className="mb-xxs text-label text-muted-foreground">Preview</p>
                          <p
                            className="font-medium text-foreground transition-all duration-[var(--duration-base)] ease-standard"
                            style={{ fontSize: `${draftSettings.defaultDocFontSize}px`, lineHeight: 1.5 }}
                          >
                            The quick brown fox jumps over the lazy dog.
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-body-sm text-muted-foreground">
                      Learners can override this with their own preference at any time.
                    </p>
                  </section>

                  <Separator className="my-lg" />

                  {/* Web Endpoint */}
                  <section className="space-y-md">
                    <div className="flex items-center gap-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Globe className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-h4 text-foreground">Web Endpoint</h3>
                        <p className="mt-xxs text-body-sm text-muted-foreground">
                          Fixed at deploy time — not editable here.
                        </p>
                      </div>
                    </div>
                    <Input
                      className="max-w-md font-mono text-body-sm"
                      value={window.location.origin}
                      readOnly
                      disabled
                    />
                  </section>
                </div>

                {/* Action bar */}
                <div className="flex items-center justify-between border-t border-border px-lg py-md">
                  <span className="text-body-sm text-muted-foreground">
                    {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!draftSettings || !hasUnsavedChanges || settingsSaving}
                  >
                    {settingsSaving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            )}

            {active === "security" && (
              <div className="flex flex-1 flex-col">
                <div className="flex-1 p-lg">
                  <section className="space-y-md">
                    <div className="flex items-center gap-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <KeyRound className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-h4 text-foreground">Change Password</h3>
                        <p className="mt-xxs text-body-sm text-muted-foreground">
                          Update your admin account credentials.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={onChangePassword} className="space-y-md">
                      <label className="flex flex-col gap-xs sm:max-w-sm">
                        <span className="text-label text-muted-foreground">Current password</span>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </label>

                      <div className="grid gap-md sm:max-w-sm sm:grid-cols-2">
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
                        <div className="space-y-xxs sm:max-w-sm">
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
                          <p className="text-body-sm text-muted-foreground">
                            {newPassword.length < 8
                              ? "Too short — minimum 8 characters"
                              : newPassword.length < 12
                                ? "Moderate — consider adding more characters"
                                : "Strong password"}
                          </p>
                        </div>
                      )}

                      {pwError && (
                        <p role="alert" className="text-body-sm text-destructive">
                          {pwError}
                        </p>
                      )}

                      <Button
                        type="submit"
                        variant="primary"
                        disabled={
                          pwSaving || !currentPassword || !newPassword || !confirmPassword
                        }
                      >
                        {pwSaving ? "Changing…" : "Change password"}
                      </Button>
                    </form>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
