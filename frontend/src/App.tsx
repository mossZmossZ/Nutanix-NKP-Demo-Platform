import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminRoute, ProtectedRoute } from "@/components/RouteGuards";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AppFallback, PageFallback } from "@/components/RouteFallback";

// design.md §7 — route-level code splitting: the initial bundle carries only the
// shell + current route; each page loads its own chunk behind a branded skeleton.
const LandingPage = lazy(() => import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const DocsIndexPage = lazy(() => import("@/pages/docs/DocsIndexPage").then((m) => ({ default: m.DocsIndexPage })));
const DocPage = lazy(() => import("@/pages/docs/DocPage").then((m) => ({ default: m.DocPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const LabAccessPage = lazy(() => import("@/pages/LabAccessPage").then((m) => ({ default: m.LabAccessPage })));
const LabViewPage = lazy(() => import("@/pages/LabViewPage").then((m) => ({ default: m.LabViewPage })));
const UsersPage = lazy(() => import("@/pages/admin/UsersPage").then((m) => ({ default: m.UsersPage })));
const LabManagementPage = lazy(() =>
  import("@/pages/admin/LabManagementPage").then((m) => ({ default: m.LabManagementPage })),
);
const AdminPortalPage = lazy(() => import("@/pages/admin/AdminPortalPage").then((m) => ({ default: m.AdminPortalPage })));
const MachinesPage = lazy(() => import("@/pages/admin/MachinesPage").then((m) => ({ default: m.MachinesPage })));
const MachinePoolPage = lazy(() => import("@/pages/admin/MachinePoolPage").then((m) => ({ default: m.MachinePoolPage })));
const LabCredentialsPage = lazy(() => import("@/pages/admin/LabCredentialsPage").then((m) => ({ default: m.LabCredentialsPage })));
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage").then((m) => ({ default: m.SettingsPage })));

function App() {
  return (
    <Routes>
      {/* Public marketing + docs share the PublicLayout chrome. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Suspense fallback={<PageFallback />}><LandingPage /></Suspense>} />
        <Route path="/docs" element={<Suspense fallback={<PageFallback />}><DocsIndexPage /></Suspense>} />
        <Route path="/docs/:slug" element={<Suspense fallback={<PageFallback />}><DocPage /></Suspense>} />
      </Route>

      <Route path="/login" element={<Suspense fallback={<PageFallback />}><LoginPage /></Suspense>} />

      {/* Authenticated app surfaces self-wrap the AppShell (children pattern). */}
      <Route element={<ProtectedRoute />}>
        <Route path="/lab-access" element={<Suspense fallback={<AppFallback />}><LabAccessPage /></Suspense>} />
        <Route path="/lab-access/:slug" element={<Suspense fallback={<AppFallback />}><LabViewPage /></Suspense>} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<Suspense fallback={<AppFallback />}><AdminPortalPage /></Suspense>} />
        <Route path="/admin/users" element={<Suspense fallback={<AppFallback />}><UsersPage /></Suspense>} />
        <Route path="/admin/labs" element={<Suspense fallback={<AppFallback />}><LabManagementPage /></Suspense>} />
        <Route path="/admin/machines" element={<Suspense fallback={<AppFallback />}><MachinesPage /></Suspense>} />
        <Route path="/admin/machine-pool" element={<Suspense fallback={<AppFallback />}><MachinePoolPage /></Suspense>} />
        <Route path="/admin/lab-credentials" element={<Suspense fallback={<AppFallback />}><LabCredentialsPage /></Suspense>} />
        <Route path="/admin/settings" element={<Suspense fallback={<AppFallback />}><SettingsPage /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
