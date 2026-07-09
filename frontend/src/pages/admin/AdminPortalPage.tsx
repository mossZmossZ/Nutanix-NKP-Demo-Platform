import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";

export function AdminPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas-parchment px-lg text-center">
      <Link to="/" className="font-text text-caption text-primary hover:underline">
        ← Back to home
      </Link>
      <h1 className="mt-md font-display text-display-md text-ink">Admin Portal</h1>
      <p className="mt-xs font-text text-body text-ink-muted-48">
        Signed in as {user?.username}
      </p>

      <div className="mt-xl flex items-center gap-md">
        <Button asChild variant="primary">
          <Link to="/admin/users">Manage users</Link>
        </Button>
        <Button variant="secondary" onClick={onLogout}>
          Sign out
        </Button>
      </div>
    </main>
  );
}
