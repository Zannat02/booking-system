import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <PageHeader
      title="Admin Dashboard"
      subtitle={`Welcome, ${user?.name}. Dashboard data will be added in the next phase.`}
    />
  );
}