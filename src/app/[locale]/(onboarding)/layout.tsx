import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";

interface OnboardingLayoutProps {
  children: ReactNode;
}

const OnboardingLayout = async ({ children }: OnboardingLayoutProps) => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    redirect("/sign-in");
  }

  // If the merchant already has a loyalty program set up, go straight to dashboard
  const program = await getProgramByOrganization(
    merchantSession.organizationId
  );
  if (program) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-muted/20 text-foreground min-h-screen antialiased">
      {children}
    </div>
  );
};

export default OnboardingLayout;
