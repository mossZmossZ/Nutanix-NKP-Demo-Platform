import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
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
import { Eye, EyeOff, Copy } from "lucide-react";
import { api, ApiError, type Role, type User } from "@/lib/api";
import Swal from "sweetalert2";

const selectClass =
  "h-10 rounded-md border border-input bg-surface px-sm py-xs text-body text-foreground " +
  "outline-none transition-[color,border-color,box-shadow] duration-[var(--duration-fast)] ease-standard " +
  "hover:border-ink-500/40 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12";

const PASSWORD_CHARSET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

function generatePassword(length = 16): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => PASSWORD_CHARSET[v % PASSWORD_CHARSET.length]).join("");
}

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");

  // Reset-password dialog
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function load() {
    try {
      setUsers(await api<User[]>("/admin/users"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load users");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    fn()
      .then(load)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Request failed"));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();

    // Close the dialog before showing SweetAlert: Radix's open Dialog marks
    // everything outside it inert, which blocks clicks on a Swal popup mounted
    // while the Dialog is still open.
    setCreateOpen(false);

    const result = await Swal.fire({
      title: 'Create New User?',
      html: `You are about to create a new user:<br/><strong>${username}</strong> with role <strong>${role}</strong>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7855FA',
      cancelButtonColor: '#5F6B7E',
      confirmButtonText: 'Yes, create user',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      setCreateOpen(true);
      return;
    }

    run(async () => {
      try {
        await api("/admin/users", {
          method: "POST",
          body: JSON.stringify({ username, password, role }),
        });
      } catch (err) {
        setCreateOpen(true);
        throw err;
      }

      setUsername("");
      setPassword("");
      setRole("user");

      await Swal.fire({
        title: 'Success!',
        text: 'User has been created successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    });
  }

  async function onChangeRole(id: string, currentUsername: string, currentRole: Role, nextRole: Role) {
    // Prevent changing role if current role is already nextRole
    if (currentRole === nextRole) return;
    
    const result = await Swal.fire({
      title: 'Change User Role?',
      html: `Change <strong>${currentUsername}</strong>'s role from <strong>${currentRole}</strong> to <strong>${nextRole}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7855FA',
      cancelButtonColor: '#5F6B7E',
      confirmButtonText: 'Yes, change role',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    run(async () => {
      await api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role: nextRole }) });
      await Swal.fire({
        title: 'Success!',
        text: 'User role has been updated.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    });
  }

  async function onSavePassword(id: string, username: string) {
    const pwd = newPassword;
    const showPwd = showNewPassword;

    // Same fix as onCreate: close the Dialog first so the Radix inert
    // trap doesn't block clicks on the SweetAlert popup.
    setResetUser(null);
    setNewPassword("");
    setShowNewPassword(false);

    function reopen() {
      const u = users.find((x) => x.id === id);
      if (u) setResetUser(u);
      setNewPassword(pwd);
      setShowNewPassword(showPwd);
    }

    const result = await Swal.fire({
      title: 'Reset Password?',
      html: `Reset password for <strong>${username}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7855FA',
      cancelButtonColor: '#5F6B7E',
      confirmButtonText: 'Yes, reset password',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      reopen();
      return;
    }

    run(async () => {
      try {
        await api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ password: pwd }) });
      } catch (err) {
        reopen();
        throw err;
      }

      await Swal.fire({
        title: 'Success!',
        text: 'Password has been reset successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    });
  }

  async function onDelete(id: string, username: string) {
    const result = await Swal.fire({
      title: 'Delete User?',
      html: `Are you sure you want to delete <strong>${username}</strong>?<br/>This action cannot be undone.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#AF2549',
      cancelButtonColor: '#5F6B7E',
      confirmButtonText: 'Yes, delete user',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    run(async () => {
      await api(`/admin/users/${id}`, { method: "DELETE" });
      await Swal.fire({
        title: 'Deleted!',
        text: 'User has been deleted successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    });
  }

  function openReset(u: User) {
    setResetUser(u);
    setNewPassword("");
    setShowNewPassword(false);
  }

  function closeReset(open: boolean) {
    if (!open) {
      setResetUser(null);
      setNewPassword("");
      setShowNewPassword(false);
    }
  }

  return (
    <AppShell nav={adminNav} title="Users">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">User Management</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage user accounts, roles, and access permissions
            </p>
          </div>
          <Button type="button" variant="primary" onClick={() => setCreateOpen(true)} className="gap-2">
            <span className="text-lg leading-none">+</span>
            New User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-iris-100 text-iris-600">
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Users</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{users.length}</p>
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
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{users.filter(u => u.role === 'user').length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-7.5 6.55a9 9 0 1113.35-12.47" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Admins</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{users.filter(u => u.role === 'admin').length}</p>
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>Create a user and assign an initial role.</DialogDescription>
          </DialogHeader>
          <form id="create-user-form" onSubmit={onCreate} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Username</span>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Password</span>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Role</span>
              <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-user-form" variant="primary">
              Add user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={resetUser !== null} onOpenChange={closeReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password — {resetUser?.username}</DialogTitle>
            <DialogDescription>Set a new password for this user.</DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-xs">
            <span className="text-label text-muted-foreground">New password</span>
            <span className="flex items-center gap-xs">
              <span className="relative flex-1">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground outline-none transition-colors duration-[var(--duration-fast)] ease-standard hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/12"
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
              <Button type="button" variant="secondary" onClick={() => setNewPassword(generatePassword())}>
                Generate
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label="Copy password"
                onClick={() => newPassword && navigator.clipboard.writeText(newPassword)}
              >
                <Copy className="size-4" />
              </Button>
            </span>
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeReset(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={newPassword.length < 8}
              onClick={() => resetUser && onSavePassword(resetUser.id, resetUser.username)}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Users Table */}
        <div className="overflow-hidden rounded-lg border border-border/40 bg-card shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead className="bg-muted/50">
              <tr className="border-b border-border/40">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="animate-in fade-in transition-colors duration-200 ease-standard hover:bg-muted/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-iris-600 text-sm font-semibold text-white uppercase shadow-sm">
                        {u.username.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{u.username}</p>
                        <p className="text-xs text-muted-foreground">{u.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className="rounded-lg border border-input bg-surface px-3 py-2 text-sm font-medium text-foreground outline-none transition-all hover:border-ink-500/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                      value={u.role}
                      onChange={(e) => onChangeRole(u.id, u.username, u.role, e.target.value as Role)}
                      disabled={u.username === "admin"}
                      title={u.username === "admin" ? "Cannot change root admin role" : ""}
                    >
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => openReset(u)} className="text-xs">
                        Reset Password
                      </Button>
                      {u.id !== me?.id && u.username !== "admin" && (
                        <Button variant="ghost" onClick={() => onDelete(u.id, u.username)} className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
