import { AppShell, type NavItem } from "@/layouts/AppShell";

const nav: NavItem[] = [{ label: "My Labs", to: "/lab-access" }];

export function LabAccessPage() {
  return (
    <AppShell nav={nav} title="Lab Access">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-xl py-xxl text-center shadow-sm">
          <h2 className="text-h3 text-foreground">No labs assigned yet</h2>
          <p className="mt-xs max-w-md text-body text-muted-foreground">
            Your labs will appear here once an admin assigns you a machine.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
