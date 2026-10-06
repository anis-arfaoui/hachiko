"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getProgramByOrganization, upsertProgram } from "@/dal/program";
import { auth } from "@/lib/auth";

export interface SaveProgramInput {
  brandColor: string;
  logoUrl?: string;
  rewardLabel: string;
  stampsRequired: number;
}

export const saveProgramAction = async (input: SaveProgramInput) => {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    return { error: "UNAUTHORIZED", success: false };
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return { error: "NO_ACTIVE_ORGANIZATION", success: false };
  }

  const program = await upsertProgram(organizationId, {
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
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user || !session.session.activeOrganizationId) {
    return null;
  }

  return getProgramByOrganization(session.session.activeOrganizationId);
};
