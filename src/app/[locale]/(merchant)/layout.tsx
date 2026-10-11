import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { MerchantNav } from "@/components/dashboard/merchant-nav";
import { getMerchantSession } from "@/dal/merchant";

interface MerchantLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const MerchantLayout = async ({ children, params }: MerchantLayoutProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (!merchantSession) {
    redirect(`/${locale}/sign-in`);
  }

  return (
    <MerchantNav initialOrgName={merchantSession.organization.name}>
      {children}
    </MerchantNav>
  );
};

export default MerchantLayout;
