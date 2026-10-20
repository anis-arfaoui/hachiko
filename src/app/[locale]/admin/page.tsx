import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminDataAction } from "@/app/actions/admin";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";
import { Button } from "@/components/ui/button";
import { getAdminSession } from "@/dal/admin";

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

const AdminPage = async ({ params }: AdminPageProps) => {
  const [{ locale }, adminSession] = await Promise.all([
    params,
    getAdminSession(),
  ]);

  if (!adminSession) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 shadow-xs">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-black text-white sm:text-2xl">
          Accès Réservé aux Administrateurs
        </h1>
        <p className="mt-2 max-w-sm text-xs text-zinc-400">
          Cette section est strictement réservée à l&apos;équipe Walaa pour la
          gestion globale de la plateforme et l&apos;activation des paiements.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link href={`/${locale}/dashboard`}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-zinc-800 text-xs text-zinc-300"
            >
              Retour au Dashboard
            </Button>
          </Link>
          <Link href={`/${locale}/sign-in`}>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground rounded-xl text-xs font-bold"
            >
              Changer de compte
            </Button>
          </Link>
        </div>
      </div>
    );
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
