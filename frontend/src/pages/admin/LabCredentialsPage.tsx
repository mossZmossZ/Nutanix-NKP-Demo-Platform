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
import { Copy, Eye, EyeOff } from "lucide-react";

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
      <div className="flex flex-col gap-xl">
        <div className="flex items-center justify-between gap-sm">
          <div className="flex flex-col gap-xxs">
            <h2 className="text-h2 text-foreground">Lab Credentials</h2>
            <p className="text-body-sm text-muted-foreground">
              Assign a provisioned machine's RDP access to a participant.
            </p>
          </div>
          <Button type="button" variant="primary" onClick={() => setAssignOpen(true)}>
            Assign credentials
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-lg py-sm text-label text-muted-foreground">User</th>
                <th className="px-lg py-sm text-label text-muted-foreground">Lab</th>
                <th className="px-lg py-sm text-label text-muted-foreground">Machine</th>
                <th className="px-lg py-sm text-label text-muted-foreground">RDP Host</th>
                <th className="px-lg py-sm text-label text-muted-foreground">Password</th>
                <th className="px-lg py-sm text-label text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const expanded = expandedId === a.id;
                return (
                  <Fragment key={a.id}>
                    <tr className="border-b border-border last:border-b-0 hover:bg-foreground/[0.03]">
                      <td className="px-lg py-sm text-body-sm text-foreground">{a.user}</td>
                      <td className="px-lg py-sm text-body-sm text-muted-foreground">{a.lab}</td>
                      <td className="px-lg py-sm text-body-sm text-muted-foreground">{a.machine}</td>
                      <td className="px-lg py-sm text-body-sm font-mono tabular-nums text-foreground">
                        {a.rdpHost}
                      </td>
                      <td className="px-lg py-sm">
                        <span className="flex items-center gap-xs">
                          <span className="font-mono text-body-sm tabular-nums text-foreground">••••••••</span>
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label={expanded ? "Hide credentials" : "Show credentials"}
                            className="px-xs py-xs"
                            onClick={() => setExpandedId((id) => (id === a.id ? null : a.id))}
                          >
                            {expanded ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </Button>
                        </span>
                      </td>
                      <td className="px-lg py-sm">
                        <Badge variant={statusVariant[a.status]}>
                          <span className={`size-1.5 rounded-full ${statusDotClass[a.status]}`} aria-hidden="true" />
                          {statusLabel[a.status]}
                        </Badge>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-border last:border-b-0 bg-foreground/[0.02]">
                        <td colSpan={6} className="px-lg py-md">
                          <div
                            className={
                              "flex flex-col gap-xs transition duration-[var(--duration-base)] ease-standard " +
                              "opacity-100 translate-y-0"
                            }
                          >
                            <CredentialRow label="Host" value={a.rdpHost} onCopy={() => copy(a.rdpHost)} />
                            <CredentialRow label="Username" value={a.username} onCopy={() => copy(a.username)} />
                            <CredentialRow label="Password" value={a.password} onCopy={() => copy(a.password)} />
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
    <div className="flex items-center justify-between gap-sm">
      <span className="text-label text-muted-foreground">{label}</span>
      <span className="flex items-center gap-xs">
        <span className="font-mono text-body-sm tabular-nums text-foreground">{value}</span>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Copy ${label.toLowerCase()}`}
          className="px-xs py-xs"
          onClick={onCopy}
        >
          <Copy className="size-3.5" />
        </Button>
      </span>
    </div>
  );
}
