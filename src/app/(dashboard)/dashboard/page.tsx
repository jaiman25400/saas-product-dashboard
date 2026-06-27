import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getSessionUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  return <DashboardContent serverRole={user!.role} />;
}
