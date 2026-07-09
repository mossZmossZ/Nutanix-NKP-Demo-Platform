import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

const fieldClass =
  "w-full rounded-md border border-border bg-surface px-md py-sm text-body text-foreground " +
  "outline-none transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-standard " +
  "hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-violet-50 px-lg">
      <Link
        to="/"
        className="w-full max-w-[24rem] text-body-sm text-primary hover:underline"
      >
        ← Return to home
      </Link>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[24rem] rounded-lg border border-border bg-surface p-xl shadow"
      >
        <div className="text-center">
          <h1 className="text-h2 text-foreground">Sign in</h1>
          <p className="mt-xs text-body text-muted-foreground">
            NKP Workshop Platform
          </p>
        </div>

        <div className="mt-xl flex flex-col gap-lg">
          <label className="flex flex-col gap-xs">
            <span className="text-label text-foreground">Username</span>
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
            <span className="text-label text-foreground">Password</span>
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
            <p role="alert" className="text-body-sm text-destructive">
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
