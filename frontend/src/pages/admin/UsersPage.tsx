import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { api, ApiError, type Role, type User } from "@/lib/api";

const inputClass =
  "rounded-md border border-hairline bg-canvas px-sm py-xs font-text text-body text-ink " +
  "outline-none focus-visible:ring-2 focus-visible:ring-primary-focus";

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Create form
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
    <main className="min-h-screen bg-canvas-parchment px-lg py-xl">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="font-text text-caption text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="mt-sm font-display text-display-md text-ink">Users</h1>

        {error && (
          <p role="alert" className="mt-md font-text text-caption text-destructive">
            {error}
          </p>
        )}

        {/* Create */}
        <form
          onSubmit={onCreate}
          className="mt-lg flex flex-wrap items-end gap-md rounded-lg border border-hairline bg-canvas p-lg"
        >
          <label className="flex flex-col gap-xs">
            <span className="font-text text-caption-strong text-ink">Username</span>
            <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-text text-caption-strong text-ink">Password</span>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-text text-caption-strong text-ink">Role</span>
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <Button type="submit" variant="primary">
            Add user
          </Button>
        </form>

        {/* List */}
        <div className="mt-lg overflow-hidden rounded-lg border border-hairline bg-canvas">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline">
                <th className="px-lg py-sm font-text text-caption-strong text-ink-muted-48">Username</th>
                <th className="px-lg py-sm font-text text-caption-strong text-ink-muted-48">Role</th>
                <th className="px-lg py-sm font-text text-caption-strong text-ink-muted-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-divider-soft last:border-b-0">
                  <td className="px-lg py-sm font-text text-body text-ink">{u.username}</td>
                  <td className="px-lg py-sm">
                    <select
                      className={inputClass}
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
                        <input
                          type="password"
                          className={inputClass}
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          minLength={8}
                        />
                        <Button variant="primary" onClick={() => onSavePassword(u.id)}>
                          Save
                        </Button>
                        <Button variant="secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-xs">
                        <Button variant="secondary" onClick={() => { setEditingId(u.id); setNewPassword(""); }}>
                          Reset password
                        </Button>
                        {u.id !== me?.id && (
                          <Button variant="secondary" onClick={() => onDelete(u.id)}>
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
      </div>
    </main>
  );
}
