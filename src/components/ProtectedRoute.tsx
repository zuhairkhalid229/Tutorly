import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loading } from "@/components/common";
import { dashboardPath, useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types/database";

// UX only: this decides which screens to show. The database's RLS policies are
// what actually stop a student from reading a tutor's data, and vice versa.
export default function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Loading className="h-screen" />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={dashboardPath(user.role)} replace />;
  return <>{children}</>;
}
