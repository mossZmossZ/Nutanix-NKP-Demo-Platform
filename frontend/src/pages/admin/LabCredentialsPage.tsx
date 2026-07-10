import { Fragment, useState, type FormEvent } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Eye, EyeOff, KeyRound, Clock } from "lucide-react";

type AssignmentStatus = "active" | "pending" | "revoked";

type Assignment = {
  id: string;
  user: string;
  lab: string;
  machine: string;
  rdpHost: string;
  username: string;
  password: string;
  status: AssignmentStatus;
};

const initialAssignments: Assignment[] = [
  {
    id: "asn-01",
    user: "alice",
    lab: "NKP Cluster Bootstrap",
    machine: "nkp-node-01",
    rdpHost: "10.42.0.5:3389",
    username: "labuser",
    password: "Xk9$vLp2Qz",
    status: "active",
  },
  {
    id: "asn-02",
    user: "bshaw",
    lab: "Cluster API Upgrade",
    machine: "nkp-node-02",
    rdpHost: "10.42.0.7:3389",
    username: "labuser",
    password: "Tr4!nWqm8s",
    status: "active",
  },
  {
    id: "asn-03",
    user: "unassigned",
    lab: "NKP Cluster Bootstrap",
    machine: "nkp-node-03",
    rdpHost: "10.42.0.9:3389",
    username: "labuser",
    password: "N/A",
    status: "pending",
  },
  {
    id: "asn-04",
    user: "carter",
    lab: "Storage Failover Drill",
    machine: "nkp-node-04",
    rdpHost: "10.42.0.11:3389",
    username: "labuser",
    password: "Hb7#eYcT31",
    status: "revoked",
  },
];

const statusLabel: Record<AssignmentStatus, string> = {
  active: "Active",
  pending: "Pending",
  revoked: "Revoked",
};

const statusVariant: Record<AssignmentStatus, "success" | "warning" | "danger"> = {
  active: "success",
  pending: "warning",
  revoked: "danger",
};

// design.md §6 — status dot: opacity/transform-only, reduced-motion-safe via
// the global `animate-pulse` utility (Tailwind already gates it sensibly);
// revoked is static (no animation = no state to draw attention to).
const statusDotClass: Record<AssignmentStatus, string> = {
  active: "bg-success animate-pulse",
  pending: "bg-warning animate-pulse [animation-duration:2s]",
  revoked: "bg-danger",
};

export function LabCredentialsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [formUser, setFormUser] = useState("");
  const [formLab, setFormLab] = useState("");
  const [formMachine, setFormMachine] = useState("");
  const [formHost, setFormHost] = useState("");
  const [formUsername, setFormUsername] = useState("labuser");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function resetForm() {
    setFormUser("");
    setFormLab("");
    setFormMachine("");
    setFormHost("");
    setFormUsername("labuser");
    setFormPassword("");
    setShowPassword(false);
  }

  function closeAssign(open: boolean) {
    setAssignOpen(open);
    if (!open) resetForm();
  }

  function onAssign(e: FormEvent) {
    e.preventDefault();
    if (!formUser || !formLab || !formMachine || !formHost || !formUsername || !formPassword) return;

    const newAssignment: Assignment = {
      id: `asn-${Date.now()}`,
      user: formUser,
      lab: formLab,
      machine: formMachine,
      rdpHost: formHost,
      username: formUsername,
      password: formPassword,
      status: "pending",
    };
    setAssignments((prev) => [...prev, newAssignment]);
    resetForm();
    setAssignOpen(false);
  }

  function copy(value: string) {
    navigator.clipboard.writeText(value);
  }

  return (
    <AppShell nav={adminNav} title="Lab Credentials">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-sm">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Lab Credentials Management</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage RDP access and assign credentials to workshop participants
            </p>
          </div>
          <Button type="button" variant="primary" onClick={() => setAssignOpen(true)} className="gap-2">
            <KeyRound className="size-4" />
            Assign Credentials
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <KeyRound className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Assignments</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{assignments.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                  {assignments.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                  {assignments.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Revoked</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                  {assignments.filter(a => a.status === 'revoked').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-border/40 bg-card shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead className="bg-muted/50">
              <tr className="border-b border-border/40">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lab</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Machine</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">RDP Host</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credentials</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {assignments.map((a) => {
                const expanded = expandedId === a.id;
                return (
                  <Fragment key={a.id}>
                    <tr className="transition-colors hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-semibold text-white uppercase">
                            {a.user.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground">{a.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{a.lab}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{a.machine}</td>
                      <td className="px-6 py-4 font-mono text-sm tabular-nums text-foreground">{a.rdpHost}</td>
                      <td className="px-6 py-4">
                        <Button
                          type="button"
                          variant="secondary"
                          aria-label={expanded ? "Hide credentials" : "Show credentials"}
                          className="gap-2"
                          onClick={() => setExpandedId((id) => (id === a.id ? null : a.id))}
                        >
                          {expanded ? (
                            <>
                              <EyeOff className="size-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="size-4" />
                              Show
                            </>
                          )}
                        </Button>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusVariant[a.status]}>
                          <span className={`size-1.5 rounded-full ${statusDotClass[a.status]}`} aria-hidden="true" />
                          {statusLabel[a.status]}
                        </Badge>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-muted/20">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-3 rounded-lg border border-border/40 bg-card p-4">
                            <div className="text-sm font-semibold text-foreground">Connection Details</div>
                            <div className="grid gap-3 md:grid-cols-3">
                              <CredentialRow label="RDP Host" value={a.rdpHost} onCopy={() => copy(a.rdpHost)} />
                              <CredentialRow label="Username" value={a.username} onCopy={() => copy(a.username)} />
                              <CredentialRow label="Password" value={a.password} onCopy={() => copy(a.password)} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={assignOpen} onOpenChange={closeAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign credentials</DialogTitle>
            <DialogDescription>Grant a participant RDP access to a provisioned machine.</DialogDescription>
          </DialogHeader>
          <form id="assign-credentials-form" onSubmit={onAssign} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">User</span>
              <Input value={formUser} onChange={(e) => setFormUser(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Lab</span>
              <Input value={formLab} onChange={(e) => setFormLab(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Machine</span>
              <Input value={formMachine} onChange={(e) => setFormMachine(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">RDP Host</span>
              <Input
                value={formHost}
                onChange={(e) => setFormHost(e.target.value)}
                placeholder="10.42.0.5:3389"
                className="font-mono"
                required
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Username</span>
              <Input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Password</span>
              <span className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground outline-none transition-colors duration-[var(--duration-fast)] ease-standard hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/12"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeAssign(false)}>
              Cancel
            </Button>
            <Button type="submit" form="assign-credentials-form" variant="primary">
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function CredentialRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium tabular-nums text-foreground">{value}</span>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Copy ${label.toLowerCase()}`}
          className="size-7 p-0"
          onClick={onCopy}
        >
          <Copy className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
