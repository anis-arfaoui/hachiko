import { RewardsMenuView } from "@/components/dashboard/rewards-menu-view";
import { getManagerSession } from "@/dal/manager";
import { getProgramByOrganization } from "@/dal/program";
import { getRewardsByProgramId } from "@/dal/rewards";

const ResponsableRewardsPage = async () => {
  const session = await getManagerSession();

  if (!session) {
    return null;
  }

  const program =
    session.program || (await getProgramByOrganization(session.organizationId));

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-foreground text-sm font-semibold">
          Aucun programme configuré.
        </p>
      </div>
    );
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

export default ResponsableRewardsPage;
