import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas-parchment px-lg text-center">
      <h1 className="font-display text-display-md text-ink">
        Signed in as {user?.username}
      </h1>
      <p className="mt-xs font-text text-body text-ink-muted-48">Role: {user?.role}</p>

      <div className="mt-xl flex items-center gap-md">
        {user?.role === "admin" && (
          <Button asChild variant="primary">
            <Link to="/admin/users">Manage users</Link>
          </Button>
        )}
        <Button variant="secondary" onClick={onLogout}>
          Sign out
        </Button>
      </div>
    </main>
  );
}
