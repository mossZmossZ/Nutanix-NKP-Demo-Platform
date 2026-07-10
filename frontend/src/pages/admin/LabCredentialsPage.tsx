import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";

export function LabCredentialsPage() {
  return (
    <AppShell nav={adminNav} title="Lab Credentials">
      <div className="text-body-sm text-muted-foreground">Lab Credentials</div>
    </AppShell>
  );
}
