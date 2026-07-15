import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import {
  Users,
  Server,
  FlaskConical,
  UserPlus,
  KeyRound,
  UserCheck,
  UserX,
  LogIn,
  Cpu,
  ArrowUpRight,
  Activity,
  FileDown,
  FilePlus2,
  Trash2,
  type LucideIcon,
} from "lucide-react";

interface ActivityRow {
  userId: string;
  username: string;
  activeSeconds: number;
  lastSeen: string | null;
  online: boolean;
}

interface AuditRow {
  id: string;
  actorUsername: string;
  action: string;
  targetType?: string;
  targetLabel?: string;
  createdAt: string;
}

interface DashboardData {
  concurrentUsers: number;
  activeToday: ActivityRow[];
  recentActivity: AuditRow[];
  counts: { users: number; machines: number; labs: number };
  machineSummary: { free: number; assigned: number; totalVcpu: number };
  labs: { slug: string; title: string; participants: number; avgProgress: number }[];
}

const REFRESH_MS = 30_000;

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type AuditType = "success" | "warning" | "info";

function describeAudit(e: AuditRow): { icon: LucideIcon; text: string; type: AuditType } {
  const actor = e.actorUsername;
  const t = e.targetLabel ?? "";
  switch (e.action) {
    case "login":
      return { icon: LogIn, text: `${actor} signed in`, type: "info" };
    case "user.create":
      return { icon: UserPlus, text: `${actor} added user ${t}`, type: "success" };
    case "user.delete":
      return { icon: UserX, text: `${actor} deleted user ${t}`, type: "warning" };
    case "assignment.create":
      return { icon: UserCheck, text: `${actor} assigned ${t}`, type: "success" };
    case "assignment.revoke":
      return { icon: UserX, text: `${actor} revoked ${t}`, type: "warning" };
    case "machine.create":
      return { icon: Server, text: `${actor} added machine ${t}`, type: "info" };
    case "machine.delete":
      return { icon: Trash2, text: `${actor} removed machine ${t}`, type: "warning" };
    case "lab.create":
      return { icon: FilePlus2, text: `${actor} created lab ${t}`, type: "info" };
    case "lab.import":
      return { icon: FileDown, text: `${actor} imported lab ${t}`, type: "info" };
    default:
      return { icon: Activity, text: `${actor} · ${e.action}`, type: "info" };
  }
}

const auditTone: Record<AuditType, string> = {
  success: "bg-emerald-100 text-emerald-600",
  warning: "bg-amber-100 text-amber-600",
  info: "bg-blue-100 text-blue-600",
};

const quickActions = [
  { label: "Provision New Machine", description: "Add infrastructure for workshop", icon: Server, to: "/admin/machines", variant: "primary" as const },
  { label: "Add Users", description: "Invite participants to platform", icon: UserPlus, to: "/admin/users", variant: "secondary" as const },
  { label: "Assign Credentials", description: "Grant lab access to users", icon: KeyRound, to: "/admin/lab-credentials", variant: "secondary" as const },
];

export function AdminPortalPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const d = await api<DashboardData>("/admin/dashboard");
        if (active) {
          setData(d);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      }
    }
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const stats = data
    ? [
        { id: "users", label: "Total Users", value: data.counts.users, icon: Users, sub: "Registered accounts" },
        { id: "machines", label: "Machine Pool", value: data.counts.machines, icon: Server, sub: "Provisioned nodes" },
        { id: "labs", label: "Labs", value: data.counts.labs, icon: FlaskConical, sub: "Workshop guides" },
      ]
    : [];

  const machineTotal = data ? data.machineSummary.free + data.machineSummary.assigned : 0;
  const assignedPct = machineTotal > 0 ? Math.round((data!.machineSummary.assigned / machineTotal) * 100) : 0;

  return (
    <AppShell nav={adminNav} title="Dashboard">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time platform activity — refreshes every 30 seconds
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        )}

        {!data && !error ? (
          <DashboardSkeleton />
        ) : data ? (
          <>
            {/* Live presence hero */}
            <Card className="overflow-hidden border-border/40 shadow-sm">
              <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                {/* Concurrent-now */}
                <div className="relative flex flex-col justify-center gap-2 bg-gradient-to-br from-violet-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-white" />
                    </span>
                    Concurrent users now
                  </div>
                  <p className="font-mono text-6xl font-bold tabular-nums">{data.concurrentUsers}</p>
                  <p className="text-sm text-white/70">
                    {data.activeToday.length} active on the platform today
                  </p>
                </div>

                {/* Per-user active time today */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                    <h3 className="text-sm font-semibold text-foreground">Active time today</h3>
                    <span className="text-xs text-muted-foreground">per user · resets at local midnight</span>
                  </div>
                  {data.activeToday.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                      No activity recorded today yet.
                    </div>
                  ) : (
                    <div className="max-h-64 divide-y divide-border/40 overflow-y-auto">
                      {data.activeToday.map((row) => (
                        <div key={row.userId} className="flex items-center justify-between px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className={`size-2 rounded-full ${row.online ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                            <span className="text-sm font-medium text-foreground">{row.username}</span>
                            {row.online && (
                              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                online
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-sm tabular-nums text-muted-foreground">
                            {formatDuration(row.activeSeconds)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Real counts */}
            <div className="grid gap-6 md:grid-cols-3">
              {stats.map((stat) => (
                <Card
                  key={stat.id}
                  className="group relative overflow-hidden border-border/40 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <h3 className="mt-2 font-mono text-3xl font-bold tabular-nums text-foreground">{stat.value}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{stat.sub}</p>
                      </div>
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600 transition-transform duration-300 group-hover:scale-110">
                        <stat.icon className="size-6" strokeWidth={2} />
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Machine pool */}
              <Card className="border-border/40 shadow-sm lg:col-span-2">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Machine Pool</CardTitle>
                    <Button variant="ghost" className="gap-1 text-xs" asChild>
                      <Link to="/admin/machines">
                        View all
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {machineTotal === 0 ? (
                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                      No machines in the pool yet.
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full bg-violet-500" />
                          <span className="font-medium text-foreground">Assigned</span>
                        </span>
                        <span className="font-mono tabular-nums text-muted-foreground">
                          {data.machineSummary.assigned} / {machineTotal} ({assignedPct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500" style={{ width: `${assignedPct}%` }} />
                      </div>
                      <div className="mt-6 grid grid-cols-3 gap-4">
                        <PoolStat label="Free" value={data.machineSummary.free} tone="text-emerald-600" />
                        <PoolStat label="Assigned" value={data.machineSummary.assigned} tone="text-violet-600" />
                        <PoolStat label="Total vCPU" value={data.machineSummary.totalVcpu} tone="text-foreground" icon={Cpu} />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Labs by enrollment */}
              <Card className="border-border/40 shadow-sm">
                <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="text-lg font-semibold">Labs by Enrollment</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {data.labs.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                      No labs yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {data.labs.map((lab) => (
                        <div key={lab.slug} className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-foreground">{lab.title}</h4>
                            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              <Users className="size-3.5" />
                              {lab.participants}
                            </span>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Avg progress</span>
                              <span className="font-medium text-foreground">{Math.round(lab.avgProgress * 100)}%</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${Math.round(lab.avgProgress * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent activity (real audit feed) */}
              <Card className="border-border/40 shadow-sm lg:col-span-2">
                <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {data.recentActivity.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                      No activity yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {data.recentActivity.map((e) => {
                        const d = describeAudit(e);
                        return (
                          <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${auditTone[d.type]}`}>
                              <d.icon className="size-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">{d.text}</p>
                              <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">{timeAgo(e.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card className="border-border/40 shadow-sm">
                <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  {quickActions.map((action) => (
                    <Button key={action.label} variant={action.variant} className="h-auto w-full justify-start gap-3 p-4" asChild>
                      <Link to={action.to}>
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                          <action.icon className="size-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{action.label}</p>
                          <p className="text-xs opacity-90">{action.description}</p>
                        </div>
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function PoolStat({ label, value, tone, icon: Icon }: { label: string; value: number; tone: string; icon?: LucideIcon }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </p>
      <p className={`mt-1 font-mono text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-44 w-full rounded-xl" />
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
