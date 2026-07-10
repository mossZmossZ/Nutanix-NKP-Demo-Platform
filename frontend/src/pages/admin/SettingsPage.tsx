import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";

export function SettingsPage() {
  return (
    <AppShell nav={adminNav} title="Settings">
      <div className="text-body-sm text-muted-foreground">Settings</div>
    </AppShell>
  );
}
