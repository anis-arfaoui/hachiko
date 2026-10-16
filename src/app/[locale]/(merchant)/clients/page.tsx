import { redirect } from "next/navigation";

import { ClientsView } from "@/components/dashboard/clients-view";
import { getMerchantClientsWithStats } from "@/dal/customer";
import { getMerchantSession } from "@/dal/merchant";

interface ClientsPageProps {
  params: Promise<{ locale: string }>;
}

const ClientsPage = async ({ params }: ClientsPageProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (!merchantSession) {
    redirect(`/${locale}/sign-in`);
  }

  const data = await getMerchantClientsWithStats(
    merchantSession.organizationId
  );

  return (
    <ClientsView
      initialClients={data.clients}
      locale={locale}
      program={data.program}
      stats={data.stats}
    />
  );
};

export default ClientsPage;
