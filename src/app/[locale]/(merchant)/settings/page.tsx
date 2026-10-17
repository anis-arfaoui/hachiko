import { redirect } from "next/navigation";

import { SettingsView } from "@/components/dashboard/settings-view";
import { getMerchantSession } from "@/dal/merchant";
import { getEstablishmentDetails } from "@/dal/settings";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

const SettingsPage = async ({ params }: SettingsPageProps) => {
  const [, session] = await Promise.all([params, getMerchantSession()]);

  if (!session) {
    redirect("/sign-in");
  }

  const details = await getEstablishmentDetails(session.organizationId);

  return <SettingsView initialDetails={details} />;
};

export default SettingsPage;
