import { Link } from "react-router-dom";
import { AppShell, type NavItem } from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";

// Machines/Assignments routes arrive in Phase 4; shown here as disabled previews
// so the admin sidebar communicates the full IA now.
const nav: NavItem[] = [
  { label: "Users", to: "/admin/users" },
  { label: "Machines", to: "/admin/machines", disabled: true },
  { label: "Assignments", to: "/admin/assignments", disabled: true },
];

export function AdminPortalPage() {
  return (
    <AppShell nav={nav} title="Admin Portal">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-xl py-xxl text-center shadow-sm">
          <h2 className="text-h3 text-foreground">No machines provisioned yet</h2>
          <p className="mt-xs max-w-md text-body text-muted-foreground">
            Provision a machine to assign it to a workshop participant. You can also
            manage user accounts and roles from here.
          </p>
          <div className="mt-lg flex items-center gap-sm">
            {/* Provisioning lands in a later phase — non-wired stub for now. */}
            <Button variant="primary">Create machine</Button>
            <Button asChild variant="secondary">
              <Link to="/admin/users">Manage users</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
