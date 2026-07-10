import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";

export function MachinesPage() {
  return (
    <AppShell nav={adminNav} title="Machines">
      <div className="text-body-sm text-muted-foreground">Machines</div>
    </AppShell>
  );
}
