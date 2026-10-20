import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { MerchantNav } from "@/components/dashboard/merchant-nav";
import { getAdminSession } from "@/dal/admin";
import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";
import { getSubscriptionDetails } from "@/dal/subscription";

interface MerchantLayoutProps {
  children: ReactNode;
}

const MerchantLayout = async ({ children }: MerchantLayoutProps) => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    const adminSession = await getAdminSession();
    if (adminSession) {
      redirect("/admin");
    }
    redirect("/sign-in");
  }

  const [program, subDetails, adminSession] = await Promise.all([
    getProgramByOrganization(merchantSession.organizationId),
    getSubscriptionDetails(merchantSession.organizationId),
    getAdminSession(),
  ]);

  if (!program) {
    redirect("/onboarding");
  }

  return (
    <MerchantNav
      initialOrgName={merchantSession.organization.name}
      subscriptionDetails={subDetails}
      isSuperAdmin={Boolean(adminSession)}
    >
      {children}
    </MerchantNav>
  );
};

export default MerchantLayout;
