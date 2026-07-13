import { LayoutDashboard, Users, BookOpen, Server, Boxes, MonitorSmartphone, KeyRound, Settings } from "lucide-react";
import type { NavItem } from "@/layouts/AppShell";

// Shared admin sidebar IA (design.md §4 App shell). All admin pages render the
// same nav so the active state + rhythm stay consistent across the console.
export const adminNav: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: <LayoutDashboard /> },
  { label: "Users", to: "/admin/users", icon: <Users /> },
  { label: "Labs", to: "/admin/labs", icon: <BookOpen /> },
  { label: "Machines", to: "/admin/machines", icon: <Server /> },
  { label: "Machine Pool", to: "/admin/machine-pool", icon: <Boxes /> },
  { label: "Lab Machines", to: "/admin/lab-machines", icon: <MonitorSmartphone /> },
  { label: "Lab Credentials", to: "/admin/lab-credentials", icon: <KeyRound /> },
  { label: "Settings", to: "/admin/settings", icon: <Settings /> },
];
