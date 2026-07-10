import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsPage() {
  return (
    <AppShell nav={adminNav} title="Settings">
      <div className="flex flex-col gap-xl">
        <h2 className="text-h2 text-foreground">Settings</h2>

        <Card>
          <CardHeader>
            <CardTitle>Platform</CardTitle>
            <CardDescription>General identity shown to participants across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-md">
            <label htmlFor="platform-name" className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Platform name</span>
              <Input id="platform-name" defaultValue="Nutanix NKP Workshop" />
            </label>
            <label htmlFor="support-email" className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Support email</span>
              <Input id="support-email" type="email" defaultValue="support@nutanix.com" />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Infrastructure defaults</CardTitle>
            <CardDescription>Applied to new machines unless overridden at provision time.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-md">
            <label htmlFor="default-k8s-version" className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Default k8s version</span>
              <Input id="default-k8s-version" className="font-mono" defaultValue="v1.29" />
            </label>
            <label htmlFor="default-node-count" className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Default node count</span>
              <Input id="default-node-count" className="font-mono tabular-nums" defaultValue="3" />
            </label>
            <label htmlFor="guac-host" className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Guacamole host</span>
              <Input id="guac-host" className="font-mono" defaultValue="guac.nkp-workshop.internal:8080" />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>The platform accent color is fixed by the design system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-xs">
              <span className="size-4 rounded-full bg-primary" />
              <span className="font-mono text-body-sm text-foreground">#702DFF</span>
              <span className="text-body-sm text-muted-foreground">Brand accent (locked)</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-sm">
          <Button variant="primary">Save changes</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </div>
    </AppShell>
  );
}
