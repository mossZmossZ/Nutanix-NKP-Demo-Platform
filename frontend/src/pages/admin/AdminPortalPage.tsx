import { Link } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Server,
  FlaskConical,
  UserPlus,
  KeyRound,
  PlayCircle,
  UserCheck,
  AlertTriangle,
  LogIn,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  ArrowUpRight,
  BarChart3,
  Zap,
  Shield,
} from "lucide-react";

const stats: {
  id: string;
  label: string;
  value: string;
  icon: typeof Users;
  sub: string;
  trend?: { direction: "up" | "down"; value: string };
  live?: boolean;
}[] = [
  {
    id: "users",
    label: "Total Users",
    value: "247",
    icon: Users,
    sub: "Active participants",
    trend: { direction: "up", value: "+12%" },
  },
  {
    id: "machines",
    label: "Infrastructure",
    value: "24",
    icon: Server,
    sub: "Provisioned nodes",
    trend: { direction: "up", value: "+4" },
  },
  {
    id: "active-labs",
    label: "Active Labs",
    value: "12",
    icon: FlaskConical,
    sub: "Running workshops",
    trend: { direction: "up", value: "+3" },
  },
];

const performanceMetrics = [
  {
    label: "Uptime",
    value: "99.97%",
    icon: Activity,
    status: "success" as const,
  },
  {
    label: "Avg Response",
    value: "142ms",
    icon: Zap,
    status: "success" as const,
  },
  {
    label: "CPU Usage",
    value: "34%",
    icon: BarChart3,
    status: "success" as const,
  },
  {
    label: "Security Score",
    value: "A+",
    icon: Shield,
    status: "success" as const,
  },
];

const machineStatus = [
  { label: "ready", count: 18, dotClassName: "bg-emerald-500", percentage: 75 },
  { label: "provisioning", count: 3, dotClassName: "bg-amber-500", percentage: 12.5 },
  { label: "maintenance", count: 2, dotClassName: "bg-blue-500", percentage: 8.3 },
  { label: "offline", count: 1, dotClassName: "bg-rose-500", percentage: 4.2 },
];

const activity: {
  id: string;
  icon: typeof UserCheck;
  text: string;
  time: string;
  type: "success" | "warning" | "info" | "error";
}[] = [
  {
    id: "1",
    icon: UserCheck,
    text: "Assigned alice → NKP Advanced Cluster Management",
    time: "2m ago",
    type: "success",
  },
  {
    id: "2",
    icon: PlayCircle,
    text: "nkp-prod-07 finished provisioning successfully",
    time: "18m ago",
    type: "success",
  },
  {
    id: "3",
    icon: UserPlus,
    text: "Added 5 new users to Enterprise Workshop cohort",
    time: "1h ago",
    type: "info",
  },
  {
    id: "4",
    icon: AlertTriangle,
    text: "nkp-node-14 health check warning - high memory usage",
    time: "3h ago",
    type: "warning",
  },
  {
    id: "5",
    icon: LogIn,
    text: "124 concurrent users logged in (peak today)",
    time: "4h ago",
    type: "info",
  },
  {
    id: "6",
    icon: Server,
    text: "Automated backup completed for all machine states",
    time: "5h ago",
    type: "success",
  },
];

const recentWorkshops = [
  {
    id: "ws-1",
    name: "NKP Enterprise Deployment",
    participants: 45,
    startDate: "Today, 09:00",
    status: "live" as const,
    progress: 68,
  },
  {
    id: "ws-2",
    name: "Advanced Cluster Operations",
    participants: 32,
    startDate: "Today, 14:00",
    status: "scheduled" as const,
    progress: 0,
  },
  {
    id: "ws-3",
    name: "Storage & Backup Strategies",
    participants: 28,
    startDate: "Tomorrow, 10:00",
    status: "scheduled" as const,
    progress: 0,
  },
];

const quickActions = [
  {
    label: "Provision New Machine",
    description: "Create infrastructure for workshop",
    icon: Server,
    to: "/admin/machines",
    variant: "primary" as const,
  },
  {
    label: "Add Users",
    description: "Invite participants to platform",
    icon: UserPlus,
    to: "/admin/users",
    variant: "secondary" as const,
  },
  {
    label: "Assign Credentials",
    description: "Grant lab access to users",
    icon: KeyRound,
    to: "/admin/lab-credentials",
    variant: "secondary" as const,
  },
];

export function AdminPortalPage() {
  return (
    <AppShell nav={adminNav} title="Dashboard">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                All Systems Operational
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor platform health, manage resources, and track workshop activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="gap-2">
              <Clock className="size-4" />
              Last 30 days
            </Button>
            <Button variant="secondary">Export Report</Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
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
                    <div className="mt-2 flex items-baseline gap-2">
                      <h3 className="font-mono text-3xl font-bold tabular-nums text-foreground">{stat.value}</h3>
                      {stat.trend && (
                        <span
                          className={`flex items-center gap-0.5 text-sm font-medium ${
                            stat.trend.direction === "up" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {stat.trend.direction === "up" ? (
                            <TrendingUp className="size-3.5" />
                          ) : (
                            <TrendingDown className="size-3.5" />
                          )}
                          {stat.trend.value}
                        </span>
                      )}
                    </div>
                    {stat.live ? (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600">
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                        </span>
                        {stat.sub}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">{stat.sub}</p>
                    )}
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

        {/* Performance Metrics Bar */}
        <div className="grid gap-4 md:grid-cols-4">
          {performanceMetrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center gap-3 rounded-lg border border-border/40 bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <metric.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                <p className="font-mono text-lg font-semibold tabular-nums text-foreground">{metric.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Infrastructure Status */}
          <Card className="border-border/40 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Infrastructure Status</CardTitle>
                <Button variant="ghost" className="gap-1 text-xs" asChild>
                  <Link to="/admin/machines">
                    View all
                    <ArrowUpRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {machineStatus.map((s) => (
                  <div key={s.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${s.dotClassName}`} />
                        <span className="font-medium capitalize text-foreground">{s.label}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-foreground">{s.count}</span>
                        <span className="text-muted-foreground">({s.percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${s.dotClassName}`}
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Total Capacity</p>
                    <p className="text-xs text-muted-foreground">192 vCPU • 768 GB RAM</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">Utilization</p>
                    <p className="text-xs text-emerald-600">Optimal (67%)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Workshops */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-semibold">Active Workshops</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {recentWorkshops.map((workshop) => (
                  <div key={workshop.id} className="p-4 transition-colors hover:bg-accent/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground">{workshop.name}</h4>
                        <p className="mt-1 text-xs text-muted-foreground">{workshop.startDate}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          workshop.status === "live"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {workshop.status === "live" ? "Live" : "Scheduled"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Users className="size-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{workshop.participants} participants</span>
                    </div>
                    {workshop.status === "live" && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">{workshop.progress}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-violet-500 transition-all duration-500"
                            style={{ width: `${workshop.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity Feed */}
          <Card className="border-border/40 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                <Button variant="ghost" className="text-xs">
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        item.type === "success"
                          ? "bg-emerald-100 text-emerald-600"
                          : item.type === "warning"
                            ? "bg-amber-100 text-amber-600"
                            : item.type === "error"
                              ? "bg-rose-100 text-rose-600"
                              : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <item.icon className="size-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.text}</p>
                      <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  className="h-auto w-full justify-start gap-3 p-4"
                  asChild
                >
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
      </div>
    </AppShell>
  );
}
