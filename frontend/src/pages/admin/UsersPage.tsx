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

  function onCreate(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await api("/admin/users", {
        method: "POST",
        body: JSON.stringify({ username, password, role }),
      });
      setUsername("");
      setPassword("");
      setRole("user");
      setCreateOpen(false);
    });
  }

  function onChangeRole(id: string, nextRole: Role) {
    run(() => api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role: nextRole }) }));
  }

  function onSavePassword(id: string) {
    run(async () => {
      await api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ password: newPassword }) });
      setResetUser(null);
      setNewPassword("");
    });
  }

  function onDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    run(() => api(`/admin/users/${id}`, { method: "DELETE" }));
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
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-sm">
          <h2 className="text-h2 text-foreground">Users</h2>
          <span className="text-body-sm text-muted-foreground">{users.length} total</span>
        </div>
        <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>
          + New user
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-md text-body-sm text-destructive">
          {error}
        </p>
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
              onClick={() => resetUser && onSavePassword(resetUser.id)}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List */}
      <div className="mt-lg overflow-hidden rounded-md border border-border">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="px-lg py-sm text-label text-muted-foreground">User</th>
              <th className="px-lg py-sm text-label text-muted-foreground">Role</th>
              <th className="px-lg py-sm text-label text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="animate-in fade-in border-b border-border duration-[var(--duration-base)] ease-standard last:border-b-0 hover:bg-foreground/[0.03]"
              >
                <td className="px-lg py-sm">
                  <span className="flex items-center gap-sm">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-label text-primary-foreground uppercase">
                      {u.username.charAt(0)}
                    </span>
                    <span className="text-body-sm text-foreground">{u.username}</span>
                  </span>
                </td>
                <td className="px-lg py-sm">
                  <select
                    className={selectClass}
                    value={u.role}
                    onChange={(e) => onChangeRole(u.id, e.target.value as Role)}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-lg py-sm">
                  <span className="flex items-center gap-xs">
                    <Button variant="ghost" onClick={() => openReset(u)}>
                      Reset password
                    </Button>
                    {u.id !== me?.id && (
                      <Button variant="ghost" onClick={() => onDelete(u.id)}>
                        Delete
                      </Button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
