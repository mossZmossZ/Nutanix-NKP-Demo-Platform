import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";

export function LabAccessPage() {
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
      <h1 className="mt-md font-display text-display-md text-ink">Lab Access</h1>
      <p className="mt-xs font-text text-body text-ink-muted-48">
        Signed in as {user?.username}
      </p>
      <p className="mt-md font-text text-body text-ink-muted-80">
        Your labs will appear here once an admin assigns you a machine.
      </p>

      <Button variant="secondary" onClick={onLogout} className="mt-xl">
        Sign out
      </Button>
    </main>
  );
}
