import { Route, Routes } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import StaffDashboardPage from "../pages/staff/StaffDashboardPage";
import CustomerDashboardPage from "../pages/customer/CustomerDashboardPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";
import RoleRoute from "./RoleRoute";
import RootRedirect from "./RootRedirect";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

     
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Login lagbe */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboardPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={["STAFF"]} />}>
          <Route path="/staff" element={<DashboardLayout />}>
            <Route index element={<StaffDashboardPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={["CUSTOMER"]} />}>
          <Route path="/customer" element={<DashboardLayout />}>
            <Route index element={<CustomerDashboardPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}