import { redirect } from "next/navigation";

import { RewardsMenuView } from "@/components/dashboard/rewards-menu-view";
import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";
import { getRewardsByProgramId } from "@/dal/rewards";

interface RewardsPageProps {
  params: Promise<{ locale: string }>;
}

const RewardsPage = async ({ params }: RewardsPageProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (!merchantSession) {
    redirect(`/${locale}/sign-in`);
  }

  const program = await getProgramByOrganization(
    merchantSession.organizationId
  );

  if (!program) {
    redirect(`/${locale}/onboarding`);
  }

  const initialRewards = await getRewardsByProgramId(program.id);

  return (
    <RewardsMenuView
      initialRewards={initialRewards}
      program={{
        brandColor: program.brandColor,
        id: program.id,
        rewardLabel: program.rewardLabel,
        stampsRequired: program.stampsRequired,
        type: program.type === "points" ? "points" : "stamps",
      }}
    />
  );
};

export default RewardsPage;
