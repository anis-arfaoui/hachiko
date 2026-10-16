import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { MerchantNav } from "@/components/dashboard/merchant-nav";
import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";

interface MerchantLayoutProps {
  children: ReactNode;
}

const MerchantLayout = async ({ children }: MerchantLayoutProps) => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    redirect("/sign-in");
  }

  const program = await getProgramByOrganization(
    merchantSession.organizationId
  );
  if (!program) {
    redirect("/onboarding");
  }

  return (
    <MerchantNav initialOrgName={merchantSession.organization.name}>
      {children}
    </MerchantNav>
  );
};

export default MerchantLayout;
