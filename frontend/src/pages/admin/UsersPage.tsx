import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api, ApiError, type Role, type User } from "@/lib/api";

const selectClass =
  "h-10 rounded-md border border-input bg-surface px-sm py-xs text-body text-foreground " +
  "outline-none transition-[color,border-color,box-shadow] duration-[var(--duration-fast)] ease-standard " +
  "hover:border-ink-500/40 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12";

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");

  // Per-row password edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

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
    });
  }

  function onChangeRole(id: string, nextRole: Role) {
    run(() => api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role: nextRole }) }));
  }

  function onSavePassword(id: string) {
    run(async () => {
      await api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ password: newPassword }) });
      setEditingId(null);
      setNewPassword("");
    });
  }

  function onDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    run(() => api(`/admin/users/${id}`, { method: "DELETE" }));
  }

  return (
    <AppShell nav={adminNav} title="Users">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 text-foreground">Users</h2>
        <Button type="button" variant="primary" onClick={() => setShowCreate((v) => !v)}>
          + New user
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-md text-body-sm text-destructive">
          {error}
        </p>
      )}

      {/* Create */}
      {showCreate && (
        <Card className="mt-lg p-lg">
          <form onSubmit={onCreate} className="flex flex-wrap items-end gap-md">
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
            <Button type="submit" variant="primary">
              Add user
            </Button>
          </form>
        </Card>
      )}

      {/* List */}
      <div className="mt-lg overflow-hidden rounded-md border border-border">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="px-lg py-sm text-label text-muted-foreground">Username</th>
              <th className="px-lg py-sm text-label text-muted-foreground">Role</th>
              <th className="px-lg py-sm text-label text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-foreground/[0.03]">
                <td className="px-lg py-sm text-body-sm text-foreground">{u.username}</td>
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
                  {editingId === u.id ? (
                    <span className="flex items-center gap-xs">
                      <Input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        className="w-auto"
                      />
                      <Button variant="primary" onClick={() => onSavePassword(u.id)}>
                        Save
                      </Button>
                      <Button variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-xs">
                      <Button variant="ghost" onClick={() => { setEditingId(u.id); setNewPassword(""); }}>
                        Reset password
                      </Button>
                      {u.id !== me?.id && (
                        <Button variant="ghost" onClick={() => onDelete(u.id)}>
                          Delete
                        </Button>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
