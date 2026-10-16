import { redirect } from "next/navigation";

import { getManagersDataAction } from "@/app/actions/manager";
import { ManagersView } from "@/components/dashboard/managers-view";
import { getMerchantSession } from "@/dal/merchant";

interface ResponsablesPageProps {
  params: Promise<{ locale: string }>;
}

const ResponsablesPage = async ({ params }: ResponsablesPageProps) => {
  const [, merchantSession] = await Promise.all([params, getMerchantSession()]);

  if (!merchantSession) {
    redirect("/sign-in");
  }

  const managers = await getManagersDataAction();

  return <ManagersView initialManagers={managers} />;
};

export default ResponsablesPage;
