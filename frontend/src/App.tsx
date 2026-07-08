import { Routes, Route, Navigate } from "react-router-dom";
import { AdminRoute, ProtectedRoute } from "@/components/RouteGuards";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { UsersPage } from "@/pages/admin/UsersPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin/users" element={<UsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
