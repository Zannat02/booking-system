import { Navigate, Outlet } from "react-router";
import FullPageLoader from "../components/common/FullPageLoader";
import { useAuth } from "../hooks/useAuth";
import { getHomePath } from "../utils/roleRedirect";

export default function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }
  if (user) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }
  return <Outlet />;
}