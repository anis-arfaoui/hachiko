"use server";

import { revalidatePath } from "next/cache";

import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization, upsertProgram } from "@/dal/program";

export interface SaveProgramInput {
  brandColor: string;
  logoUrl?: string;
  rewardLabel: string;
  stampsRequired: number;
}

export const saveProgramAction = async (input: SaveProgramInput) => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    return { error: "UNAUTHORIZED", success: false };
  }

  const program = await upsertProgram(merchantSession.organizationId, {
    brandColor: input.brandColor,
    logoUrl: input.logoUrl,
    rewardLabel: input.rewardLabel.trim(),
    stampsRequired: Math.max(1, Math.min(30, input.stampsRequired)),
  });

  revalidatePath("/dashboard/program");
  revalidatePath("/dashboard");

  return { program, success: true };
};

export const getMyProgramAction = async () => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    return null;
  }

  return getProgramByOrganization(merchantSession.organizationId);
};
