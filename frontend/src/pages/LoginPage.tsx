import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

const fieldClass =
  "w-full rounded-md border border-hairline bg-canvas px-md py-sm font-text text-body text-ink " +
  "outline-none focus-visible:ring-2 focus-visible:ring-primary-focus";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/home" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas-parchment px-lg">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl"
      >
        <h1 className="font-display text-display-md text-ink">Sign in</h1>
        <p className="mt-xs font-text text-body text-ink-muted-48">
          NKP Workshop Platform
        </p>

        <div className="mt-xl flex flex-col gap-lg">
          <label className="flex flex-col gap-xs">
            <span className="font-text text-caption-strong text-ink">Username</span>
            <input
              className={fieldClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </label>

          <label className="flex flex-col gap-xs">
            <span className="font-text text-caption-strong text-ink">Password</span>
            <input
              type="password"
              className={fieldClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p role="alert" className="font-text text-caption text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </main>
  );
}
