import { Fragment, useEffect, useState, type FormEvent } from "react";
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
import { Boxes, Copy, Eye, EyeOff, HardDrive, Pencil, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type MachineStatus = "free" | "assigned";

type Machine = {
  id: string;
  name?: string;
  rdpHost: string;
  rdpPort: number;
  rdpUser: string;
  rdpPassword: string;
  status: MachineStatus;
};

const PASSWORD_CHARSET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

function generatePassword(length = 16): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => PASSWORD_CHARSET[v % PASSWORD_CHARSET.length]).join("");
}

type FormState = {
  name: string;
  rdpHost: string;
  rdpPort: string;
  rdpUser: string;
  rdpPassword: string;
};

const emptyForm: FormState = {
  name: "",
  rdpHost: "",
  rdpPort: "3389",
  rdpUser: "labuser",
  rdpPassword: "",
};

export function MachinePoolPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteBlockedId, setDeleteBlockedId] = useState<string | null>(null);

  // Import dialog
  const [importOpen, setImportOpen] = useState(false);
  const [importForm, setImportForm] = useState<FormState>(emptyForm);
  const [showImportPassword, setShowImportPassword] = useState(false);

  // Edit dialog
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [showEditPassword, setShowEditPassword] = useState(false);

  async function load() {
    try {
      setMachines(await api<Machine[]>("/admin/machines"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load machines");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    return fn()
      .then(load)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Request failed");
        throw err;
      });
  }

  function closeImport(open: boolean) {
    setImportOpen(open);
    if (!open) {
      setImportForm(emptyForm);
      setShowImportPassword(false);
    }
  }

  async function onImport(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await api("/admin/machines", {
        method: "POST",
        body: JSON.stringify({
          name: importForm.name || undefined,
          rdpHost: importForm.rdpHost,
          rdpPort: importForm.rdpPort ? Number(importForm.rdpPort) : undefined,
          rdpUser: importForm.rdpUser,
          rdpPassword: importForm.rdpPassword,
        }),
      });
      closeImport(false);
    }).catch(() => {});
  }

  function openEdit(m: Machine) {
    setEditMachine(m);
    setEditForm({
      name: m.name ?? "",
      rdpHost: m.rdpHost,
      rdpPort: String(m.rdpPort),
      rdpUser: m.rdpUser,
      rdpPassword: "",
    });
    setShowEditPassword(false);
  }

  function closeEdit(open: boolean) {
    if (!open) {
      setEditMachine(null);
      setEditForm(emptyForm);
      setShowEditPassword(false);
    }
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editMachine) return;
    const id = editMachine.id;
    run(async () => {
      await api(`/admin/machines/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name || undefined,
          rdpHost: editForm.rdpHost,
          rdpPort: editForm.rdpPort ? Number(editForm.rdpPort) : undefined,
          rdpUser: editForm.rdpUser,
          ...(editForm.rdpPassword ? { rdpPassword: editForm.rdpPassword } : {}),
        }),
      });
      closeEdit(false);
    }).catch(() => {});
  }

  async function onDelete(m: Machine) {
    if (m.status === "assigned") {
      setDeleteBlockedId(m.id);
      return;
    }
    run(() => api(`/admin/machines/${m.id}`, { method: "DELETE" })).catch(() => {});
  }

  function copy(value: string) {
    navigator.clipboard.writeText(value);
  }

  const total = machines.length;
  const free = machines.filter((m) => m.status === "free").length;
  const assigned = machines.filter((m) => m.status === "assigned").length;

  return (
    <AppShell nav={adminNav} title="Machine Pool">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-sm">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Machine Pool</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Import and manage the RDP machine inventory available for lab assignment
            </p>
          </div>
          <Button type="button" variant="primary" onClick={() => setImportOpen(true)} className="gap-2">
            <HardDrive className="size-4" />
            Import Machine
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-iris-100 text-iris-600">
                <Boxes className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Machines</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{total}</p>
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
                <p className="text-xs font-medium text-muted-foreground">Free</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{free}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <HardDrive className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Assigned</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{assigned}</p>
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

        {/* List */}
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-card px-6 py-16 text-center shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-full bg-iris-100 text-iris-600">
              <Boxes className="size-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">No machines yet — import your first</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Machines you import here become available for lab credential assignment.
              </p>
            </div>
            <Button type="button" variant="primary" onClick={() => setImportOpen(true)} className="mt-2 gap-2">
              <HardDrive className="size-4" />
              Import Machine
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/40 bg-card shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/50">
                <tr className="border-b border-border/40">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Machine</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Host</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credentials</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {machines.map((m) => {
                  const expanded = expandedId === m.id;
                  const blocked = m.status === "assigned";
                  return (
                    <Fragment key={m.id}>
                      <tr className="transition-colors duration-200 ease-standard hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-iris-600 text-white shadow-sm">
                              <HardDrive className="size-4" />
                            </div>
                            <span className="font-medium text-foreground">{m.name || m.rdpHost}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm tabular-nums text-foreground">
                          {m.rdpHost}:{m.rdpPort}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{m.rdpUser}</td>
                        <td className="px-6 py-4">
                          <Button
                            type="button"
                            variant="secondary"
                            aria-label={expanded ? "Hide credentials" : "Show credentials"}
                            className="gap-2"
                            onClick={() => setExpandedId((id) => (id === m.id ? null : m.id))}
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
                          <Badge variant={m.status === "free" ? "success" : "neutral"}>
                            <span
                              className={`size-1.5 rounded-full ${m.status === "free" ? "bg-success" : "bg-muted-foreground"}`}
                              aria-hidden="true"
                            />
                            {m.status === "free" ? "Free" : "Assigned"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              aria-label="Edit machine"
                              className="size-8 p-0"
                              onClick={() => openEdit(m)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              aria-label="Delete machine"
                              className="size-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:text-muted-foreground"
                              disabled={blocked}
                              title={blocked ? "Machine is assigned — unassign before deleting" : undefined}
                              onClick={() => onDelete(m)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          {deleteBlockedId === m.id && (
                            <p className="mt-1 text-xs font-medium text-destructive">Machine is assigned</p>
                          )}
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-muted/20">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="space-y-3 rounded-lg border border-border/40 bg-card p-4">
                              <div className="text-sm font-semibold text-foreground">Connection Details</div>
                              <div className="grid gap-3 md:grid-cols-3">
                                <CredentialRow
                                  label="RDP Host"
                                  value={`${m.rdpHost}:${m.rdpPort}`}
                                  onCopy={() => copy(`${m.rdpHost}:${m.rdpPort}`)}
                                />
                                <CredentialRow label="Username" value={m.rdpUser} onCopy={() => copy(m.rdpUser)} />
                                <CredentialRow label="Password" value={m.rdpPassword} onCopy={() => copy(m.rdpPassword)} />
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
        )}
      </div>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={closeImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import machine</DialogTitle>
            <DialogDescription>Add a machine to the pool for future lab assignment.</DialogDescription>
          </DialogHeader>
          <form id="import-machine-form" onSubmit={onImport} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Name (optional)</span>
              <Input
                value={importForm.name}
                onChange={(e) => setImportForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="nkp-node-05"
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">RDP Host</span>
              <Input
                value={importForm.rdpHost}
                onChange={(e) => setImportForm((f) => ({ ...f, rdpHost: e.target.value }))}
                placeholder="10.42.0.5"
                className="font-mono"
                required
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">RDP Port</span>
              <Input
                type="number"
                value={importForm.rdpPort}
                onChange={(e) => setImportForm((f) => ({ ...f, rdpPort: e.target.value }))}
                placeholder="3389"
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Username</span>
              <Input
                value={importForm.rdpUser}
                onChange={(e) => setImportForm((f) => ({ ...f, rdpUser: e.target.value }))}
                required
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Password</span>
              <span className="flex items-center gap-xs">
                <span className="relative flex-1">
                  <Input
                    type={showImportPassword ? "text" : "password"}
                    value={importForm.rdpPassword}
                    onChange={(e) => setImportForm((f) => ({ ...f, rdpPassword: e.target.value }))}
                    className="pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowImportPassword((v) => !v)}
                    aria-label={showImportPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground outline-none transition-colors duration-[var(--duration-fast)] ease-standard hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/12"
                  >
                    {showImportPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setImportForm((f) => ({ ...f, rdpPassword: generatePassword() }))}
                >
                  Generate
                </Button>
              </span>
            </label>
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeImport(false)}>
              Cancel
            </Button>
            <Button type="submit" form="import-machine-form" variant="primary">
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editMachine !== null} onOpenChange={closeEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit machine — {editMachine?.name || editMachine?.rdpHost}</DialogTitle>
            <DialogDescription>Update connection details. Leave password blank to keep it unchanged.</DialogDescription>
          </DialogHeader>
          <form id="edit-machine-form" onSubmit={onSaveEdit} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Name (optional)</span>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">RDP Host</span>
              <Input
                value={editForm.rdpHost}
                onChange={(e) => setEditForm((f) => ({ ...f, rdpHost: e.target.value }))}
                className="font-mono"
                required
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">RDP Port</span>
              <Input
                type="number"
                value={editForm.rdpPort}
                onChange={(e) => setEditForm((f) => ({ ...f, rdpPort: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Username</span>
              <Input
                value={editForm.rdpUser}
                onChange={(e) => setEditForm((f) => ({ ...f, rdpUser: e.target.value }))}
                required
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">New password (optional)</span>
              <span className="flex items-center gap-xs">
                <span className="relative flex-1">
                  <Input
                    type={showEditPassword ? "text" : "password"}
                    value={editForm.rdpPassword}
                    onChange={(e) => setEditForm((f) => ({ ...f, rdpPassword: e.target.value }))}
                    placeholder="Leave blank to keep current password"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword((v) => !v)}
                    aria-label={showEditPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground outline-none transition-colors duration-[var(--duration-fast)] ease-standard hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/12"
                  >
                    {showEditPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditForm((f) => ({ ...f, rdpPassword: generatePassword() }))}
                >
                  Generate
                </Button>
              </span>
            </label>
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeEdit(false)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-machine-form" variant="primary">
              Save
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
