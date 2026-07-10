import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsPage() {
  return (
    <AppShell nav={adminNav} title="Settings">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Platform Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure platform identity, infrastructure defaults, and system preferences
          </p>
        </div>
        {/* Infrastructure Defaults */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Infrastructure Defaults</CardTitle>
                <CardDescription className="mt-0.5">Applied to new machine provisions unless overridden</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label htmlFor="default-k8s-version" className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Kubernetes Version</span>
                <Input id="default-k8s-version" className="font-mono" defaultValue="v1.29" />
                <span className="text-xs text-muted-foreground">Default cluster version</span>
              </label>
              <label htmlFor="default-node-count" className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Node Count</span>
                <Input id="default-node-count" type="number" className="font-mono tabular-nums" defaultValue="3" />
                <span className="text-xs text-muted-foreground">Worker nodes per cluster</span>
              </label>
              <label htmlFor="default-vcpu" className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">vCPU per Node</span>
                <Input id="default-vcpu" type="number" className="font-mono tabular-nums" defaultValue="8" />
                <span className="text-xs text-muted-foreground">Virtual CPU allocation</span>
              </label>
              <label htmlFor="default-memory" className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Memory per Node</span>
                <Input id="default-memory" className="font-mono" defaultValue="32 GiB" />
                <span className="text-xs text-muted-foreground">RAM allocation per node</span>
              </label>
              <label htmlFor="guac-host" className="col-span-2 flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Guacamole Host</span>
                <Input id="guac-host" className="font-mono" defaultValue="guac.nkp-workshop.internal:8080" />
                <span className="text-xs text-muted-foreground">Remote desktop gateway endpoint</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Security & Access Control</CardTitle>
                <CardDescription className="mt-0.5">Configure authentication and session management</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6">
            <label htmlFor="session-timeout" className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Session Timeout</span>
              <div className="flex items-center gap-3">
                <Input id="session-timeout" type="number" className="max-w-[120px] font-mono tabular-nums" defaultValue="720" />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
              <span className="text-xs text-muted-foreground">Auto-logout inactive users after this period</span>
            </label>
            <label htmlFor="password-policy" className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Minimum Password Length</span>
              <div className="flex items-center gap-3">
                <Input id="password-policy" type="number" className="max-w-[120px] font-mono tabular-nums" defaultValue="8" />
                <span className="text-sm text-muted-foreground">characters</span>
              </div>
              <span className="text-xs text-muted-foreground">Enforce minimum password complexity</span>
            </label>
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300/50"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Branding & Theme</CardTitle>
                <CardDescription className="mt-0.5">Customize visual identity and color scheme</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
                  <span className="size-6 rounded-full bg-white/90" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Primary Brand Color</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">#702DFF</span>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">Enterprise</span>
                  </div>
                </div>
                <Button variant="secondary">Change Color</Button>
              </div>
              <div className="grid grid-cols-4 gap-3 rounded-lg border border-border/40 bg-muted/30 p-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-12 rounded-lg bg-violet-600" />
                  <span className="text-xs font-medium text-muted-foreground">Primary</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-12 rounded-lg bg-emerald-500" />
                  <span className="text-xs font-medium text-muted-foreground">Success</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-12 rounded-lg bg-amber-500" />
                  <span className="text-xs font-medium text-muted-foreground">Warning</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-12 rounded-lg bg-rose-500" />
                  <span className="text-xs font-medium text-muted-foreground">Error</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 border-t border-border/40 pt-6">
          <Button variant="primary" className="gap-2">
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Save Changes
          </Button>
          <Button variant="secondary">Reset to Defaults</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </div>
    </AppShell>
  );
}
