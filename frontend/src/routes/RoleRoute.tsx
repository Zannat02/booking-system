import { Navigate, Outlet } from "react-router";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";
import { getHomePath } from "../utils/roleRedirect";

interface RoleRouteProps {
  allowedRoles: Role[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }
  return <Outlet />;
}