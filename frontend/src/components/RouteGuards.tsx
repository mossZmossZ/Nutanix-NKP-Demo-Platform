import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-parchment">
      <p className="font-text text-body text-ink-muted-48">Loading…</p>
    </div>
  );
}

/** Requires any authenticated user; otherwise -> /login. */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

/** Requires an admin; non-admins -> lab access, unauthenticated -> /login. */
export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "admin" ? <Outlet /> : <Navigate to="/lab-access" replace />;
}
