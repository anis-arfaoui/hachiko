import { redirect } from "next/navigation";

import { BillingView } from "@/components/dashboard/billing-view";
import { getMerchantSession } from "@/dal/merchant";
import { getSubscriptionDetails } from "@/dal/subscription";

interface BillingPageProps {
  params: Promise<{ locale: string }>;
}

const BillingPage = async ({ params }: BillingPageProps) => {
  const [, session] = await Promise.all([params, getMerchantSession()]);

  if (!session) {
    redirect("/sign-in");
  }

  const details = await getSubscriptionDetails(session.organizationId);
  if (!details) {
    redirect("/dashboard");
  }

  return <BillingView initialDetails={details} />;
};

export default BillingPage;
