import { Navigate } from "react-router";
import FullPageLoader from "../components/common/FullPageLoader";
import { useAuth } from "../hooks/useAuth";
import { getHomePath } from "../utils/roleRedirect";

export default function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }
  return <Navigate to={user ? getHomePath(user.role) : "/login"} replace />;
}