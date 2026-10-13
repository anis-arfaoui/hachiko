import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getMerchantSession } from "@/dal/merchant";

interface OnboardingPageProps {
  params: Promise<{ locale: string }>;
}

const OnboardingPage = async ({ params }: OnboardingPageProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (!merchantSession) {
    redirect(`/${locale}/sign-in`);
  }

  return (
    <OnboardingWizard initialBusinessName={merchantSession.organization.name} />
  );
};

export default OnboardingPage;
