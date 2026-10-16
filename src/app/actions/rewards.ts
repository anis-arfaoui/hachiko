"use server";

import { revalidatePath } from "next/cache";

import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";
import { getRewardsByProgramId, syncProgramRewards } from "@/dal/rewards";
import type { RewardItem, SaveRewardInput } from "@/dal/rewards";

export interface GetProgramRewardsResult {
  program: {
    brandColor: string;
    id: string;
    rewardLabel: string;
    stampsRequired: number;
    type: "points" | "stamps";
  } | null;
  rewards: RewardItem[];
}

export const getProgramRewardsAction =
  async (): Promise<GetProgramRewardsResult | null> => {
    const merchantSession = await getMerchantSession();

    if (!merchantSession) {
      return null;
    }

    const program = await getProgramByOrganization(
      merchantSession.organizationId
    );

    if (!program) {
      return null;
    }

    const rewardsList = await getRewardsByProgramId(program.id);
    const effectiveRewards: RewardItem[] =
      rewardsList.length > 0
        ? rewardsList
        : [
            {
              cost: program.stampsRequired,
              createdAt: new Date(),
              description: null,
              id: "initial-reward",
              label: program.rewardLabel,
              programId: program.id,
            },
          ];

    return {
      program: {
        brandColor: program.brandColor,
        id: program.id,
        rewardLabel: program.rewardLabel,
        stampsRequired: program.stampsRequired,
        type: program.type === "points" ? "points" : "stamps",
      },
      rewards: effectiveRewards,
    };
  };

export interface SaveProgramRewardsResult {
  error?: string;
  rewards?: RewardItem[];
  success: boolean;
}

export const saveProgramRewardsAction = async (
  rewardList: SaveRewardInput[]
): Promise<SaveProgramRewardsResult> => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    return { error: "UNAUTHORIZED", success: false };
  }

  const program = await getProgramByOrganization(
    merchantSession.organizationId
  );

  if (!program) {
    return { error: "PROGRAM_NOT_FOUND", success: false };
  }

  const validRewards = rewardList.filter(
    (r) => r.label.trim().length > 0 && Number(r.cost) > 0
  );

  if (validRewards.length === 0) {
    return {
      error: "Vous devez définir au moins une récompense valide.",
      success: false,
    };
  }

  const updatedRewards = await syncProgramRewards(program.id, validRewards);

  revalidatePath("/rewards");
  revalidatePath("/reward");
  revalidatePath("/dashboard/rewards");
  revalidatePath("/dashboard");
  revalidatePath("/program");
  revalidatePath("/dashboard/program");

  return {
    rewards: updatedRewards,
    success: true,
  };
};
