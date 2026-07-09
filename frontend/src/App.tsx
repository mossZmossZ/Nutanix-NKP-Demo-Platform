import { Routes, Route, Navigate } from "react-router-dom";
import { AdminRoute, ProtectedRoute } from "@/components/RouteGuards";
import { PublicLayout } from "@/layouts/PublicLayout";
import { LandingPage } from "@/pages/LandingPage";
import { DocsIndexPage } from "@/pages/docs/DocsIndexPage";
import { DocPage } from "@/pages/docs/DocPage";
import { LabAccessPage } from "@/pages/LabAccessPage";
import { LoginPage } from "@/pages/LoginPage";
import { UsersPage } from "@/pages/admin/UsersPage";
import { AdminPortalPage } from "@/pages/admin/AdminPortalPage";

function App() {
  return (
    <Routes>
      {/* Public marketing + docs share the PublicLayout chrome. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocsIndexPage />} />
        <Route path="/docs/:slug" element={<DocPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated app keeps its own chrome (AppLayout arrives in Phase 3). */}
      <Route element={<ProtectedRoute />}>
        <Route path="/lab-access" element={<LabAccessPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminPortalPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
