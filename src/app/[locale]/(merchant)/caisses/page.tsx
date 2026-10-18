import { redirect } from "next/navigation";

import { getCashiersDataAction } from "@/app/actions/cashier";
import { CashiersView } from "@/components/dashboard/cashiers-view";
import { getMerchantSession } from "@/dal/merchant";

interface CaissesPageProps {
  params: Promise<{ locale: string }>;
}

const CaissesPage = async ({ params }: CaissesPageProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (!merchantSession) {
    redirect("/sign-in");
  }

  const data = await getCashiersDataAction("30d");

  return (
    <CashiersView
      initialCashiers={data?.cashiers || []}
      initialLocations={data?.locations || []}
      initialStats={data?.stats || []}
      locale={locale}
      program={data?.program || null}
    />
  );
};

export default CaissesPage;
