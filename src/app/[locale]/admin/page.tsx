import { redirect } from "next/navigation";

import { getAdminDataAction } from "@/app/actions/admin";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";
import { getAdminSession } from "@/dal/admin";

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

const AdminPage = async ({ params }: AdminPageProps) => {
  const [{ locale }, adminSession] = await Promise.all([
    params,
    getAdminSession(),
  ]);

  // If not authenticated as admin, redirect to sign-in
  if (!adminSession) {
    redirect(`/${locale}/sign-in`);
  }

  const data = await getAdminDataAction();

  if (!data) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 sm:py-10">
      <AdminDashboardView
        adminUser={data.adminUser}
        initialOrganizations={data.organizations}
        initialPendingStores={data.pendingStores}
        initialPendingSubscriptions={data.pendingSubscriptions}
        initialStats={data.stats}
        locale={locale}
      />
    </div>
  );
};

export default AdminPage;
