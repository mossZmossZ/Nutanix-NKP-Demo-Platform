import { Fragment, useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Eye, EyeOff, KeyRound, ServerCog } from "lucide-react";
import { api, ApiError } from "@/lib/api";

const selectClass =
  "h-10 rounded-md border border-input bg-surface px-sm py-xs text-body text-foreground " +
  "outline-none transition-[color,border-color,box-shadow] duration-[var(--duration-fast)] ease-standard " +
  "hover:border-ink-500/40 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

type AdminUser = { id: string; username: string };
type Lab = { _id: string; slug: string; title: string };
type Machine = {
  id: string;
  name?: string;
  rdpHost: string;
  rdpPort: number;
  rdpUser: string;
  status: string;
};

type Assignment = {
  id: string;
  user: { id: string; username: string };
  lab: { id: string; slug: string; title: string };
  machine: { id: string; name?: string; status: string };
  rdpHost: string;
  rdpPort: number;
  rdpUser: string;
  rdpPassword: string;
  completedPages: number;
};

export function LabCredentialsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [formUser, setFormUser] = useState("");
  const [formLab, setFormLab] = useState("");
  const [formMachine, setFormMachine] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);

  // Revoke confirm dialog
  const [revokeTarget, setRevokeTarget] = useState<Assignment | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const freeMachines = machines.filter((m) => m.status === "free");

  async function load() {
    try {
      const [a, u, l, m] = await Promise.all([
        api<Assignment[]>("/admin/assignments"),
        api<AdminUser[]>("/admin/users"),
        api<Lab[]>("/admin/labs"),
        api<Machine[]>("/admin/machines"),
      ]);
      setAssignments(a);
      setUsers(u);
      setLabs(l);
      setMachines(m);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load lab credentials");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setFormUser("");
    setFormLab("");
    setFormMachine("");
    setAssignError(null);
  }

  function closeAssign(open: boolean) {
    setAssignOpen(open);
    if (!open) resetForm();
  }

  async function onAssign(e: FormEvent) {
    e.preventDefault();
    if (!formUser || !formLab || !formMachine) return;

    setAssignError(null);
    try {
      await api("/admin/assignments", {
        method: "POST",
        body: JSON.stringify({ userId: formUser, labId: formLab, machineId: formMachine }),
      });
      await load();
      resetForm();
      setAssignOpen(false);
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : "Failed to assign credentials");
    }
  }

  async function onRevoke() {
    if (!revokeTarget) return;
    setRevokeError(null);
    try {
      await api(`/admin/assignments/${revokeTarget.id}`, { method: "DELETE" });
      setRevokeTarget(null);
      await load();
    } catch (err) {
      setRevokeError(err instanceof ApiError ? err.message : "Failed to revoke assignment");
    }
  }

  function copy(value: string) {
    navigator.clipboard.writeText(value);
  }

  return (
    <AppShell nav={adminNav} title="Lab Machines">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-sm">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Lab Machine Management</h2>
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
        <div className="grid gap-4 md:grid-cols-2">
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
                <ServerCog className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Free Machines Available</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{freeMachines.length}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <div className="flex items-center gap-2">
              <svg className="size-5 text-destructive" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          </div>
        )}

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
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {assignments.map((a) => {
                const expanded = expandedId === a.id;
                const host = `${a.rdpHost}:${a.rdpPort}`;
                return (
                  <Fragment key={a.id}>
                    <tr className="transition-colors hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-semibold text-white uppercase">
                            {a.user.username.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground">{a.user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{a.lab.title}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {a.machine.name ?? a.machine.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm tabular-nums text-foreground">{host}</td>
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
                        <Badge variant="success">
                          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                          Active
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setRevokeTarget(a)}
                          className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          Revoke
                        </Button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-muted/20">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-3 rounded-lg border border-border/40 bg-card p-4">
                            <div className="text-sm font-semibold text-foreground">Connection Details</div>
                            <div className="grid gap-3 md:grid-cols-3">
                              <CredentialRow label="RDP Host" value={host} onCopy={() => copy(host)} />
                              <CredentialRow label="Username" value={a.rdpUser} onCopy={() => copy(a.rdpUser)} />
                              <CredentialRow label="Password" value={a.rdpPassword} onCopy={() => copy(a.rdpPassword)} />
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
              <select className={selectClass} value={formUser} onChange={(e) => setFormUser(e.target.value)} required>
                <option value="" disabled>
                  Select a user
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Lab</span>
              <select className={selectClass} value={formLab} onChange={(e) => setFormLab(e.target.value)} required>
                <option value="" disabled>
                  Select a lab
                </option>
                {labs.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Machine</span>
              <select
                className={selectClass}
                value={formMachine}
                onChange={(e) => setFormMachine(e.target.value)}
                disabled={freeMachines.length === 0}
                required
              >
                <option value="" disabled>
                  Select a machine
                </option>
                {freeMachines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? m.rdpHost}
                  </option>
                ))}
              </select>
              {freeMachines.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No free machines — import one in Machine Pool.
                </span>
              )}
            </label>
            {assignError && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {assignError}
              </p>
            )}
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeAssign(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="assign-credentials-form"
              variant="primary"
              disabled={freeMachines.length === 0}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null);
            setRevokeError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke access</DialogTitle>
            <DialogDescription>
              Revoke <strong>{revokeTarget?.user.username}</strong>&apos;s access to{" "}
              <strong>{revokeTarget?.lab.title}</strong>? The machine returns to the free pool.
            </DialogDescription>
          </DialogHeader>
          {revokeError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {revokeError}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={onRevoke}>
              Revoke
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
