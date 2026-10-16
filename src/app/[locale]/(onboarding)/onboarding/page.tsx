import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";

const OnboardingPage = async () => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    redirect("/sign-in");
  }

  const existingProgram = await getProgramByOrganization(
    merchantSession.organizationId
  );
  if (existingProgram) {
    redirect("/dashboard");
  }

  return (
    <OnboardingWizard initialBusinessName={merchantSession.organization.name} />
  );
};

export default OnboardingPage;
