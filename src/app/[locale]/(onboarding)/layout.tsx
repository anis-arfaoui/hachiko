import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";

interface OnboardingLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const OnboardingLayout = async ({
  children,
  params,
}: OnboardingLayoutProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (!merchantSession) {
    redirect(`/${locale}/sign-in`);
  }

  // If the merchant already has a loyalty program set up, go straight to dashboard
  const program = await getProgramByOrganization(
    merchantSession.organizationId
  );
  if (program) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="bg-muted/20 text-foreground min-h-screen antialiased">
      {children}
    </div>
  );
};

export default OnboardingLayout;
