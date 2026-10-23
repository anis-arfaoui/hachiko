import { redirect } from "next/navigation";

import { AutomationsView } from "@/components/dashboard/automations-view";
import { getAutomations } from "@/dal/automation";
import { getMerchantSession } from "@/dal/merchant";

interface AutomationsPageProps {
  params: Promise<{ locale: string }>;
}

const AutomationsPage = async ({ params }: AutomationsPageProps) => {
  const [, merchantSession] = await Promise.all([params, getMerchantSession()]);

  if (!merchantSession) {
    redirect("/sign-in");
  }

  const config = await getAutomations(merchantSession.organizationId);

  return <AutomationsView initialConfig={config} />;
};

export default AutomationsPage;
