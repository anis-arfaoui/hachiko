import { getCashiersDataAction } from "@/app/actions/cashier";
import { CashiersView } from "@/components/dashboard/cashiers-view";
import { getManagerSession } from "@/dal/manager";

interface ResponsableCaissesPageProps {
  params: Promise<{ locale: string }>;
}

const ResponsableCaissesPage = async ({
  params,
}: ResponsableCaissesPageProps) => {
  const [{ locale }, session] = await Promise.all([
    params,
    getManagerSession(),
  ]);

  if (!session) {
    return null;
  }

  const data = await getCashiersDataAction("30d");

  return (
    <CashiersView
      initialCashiers={data?.cashiers || []}
      initialStats={data?.stats || []}
      locale={locale}
      program={data?.program || null}
    />
  );
};

export default ResponsableCaissesPage;
