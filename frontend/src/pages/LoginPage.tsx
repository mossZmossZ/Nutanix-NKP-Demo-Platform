import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api";

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-lg bg-canvas px-lg">
      <div className="flex items-center gap-xs">
        <span
          className="size-2 rounded-sm"
          style={{ background: 'var(--gradient-prism)' }}
          aria-hidden="true"
        />
        <span className="text-label uppercase tracking-wide text-foreground">
          NKP Workshop Platform
        </span>
      </div>

      <Card className="w-full max-w-[24rem] rounded-lg shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-h3">Sign in</CardTitle>
          <CardDescription>Use your assigned workshop credentials</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-lg">
            <div className="flex flex-col gap-xs">
              <label htmlFor="username" className="text-label text-foreground">
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                aria-invalid={!!error}
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label htmlFor="password" className="text-label text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                aria-invalid={!!error}
              />
            </div>

            {error && (
              <p role="alert" className="text-body-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" disabled={submitting} className="w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link to="/" className="text-body-sm text-blue-600 hover:underline">
        ← Return to home
      </Link>
    </main>
  );
}
