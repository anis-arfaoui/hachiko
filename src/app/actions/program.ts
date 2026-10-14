"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization, upsertProgram } from "@/dal/program";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";

export interface SaveProgramInput {
  brandColor: string;
  logoUrl?: string;
  rewardLabel: string;
  stampsRequired: number;
  type?: "stamps" | "points";
}

export const saveProgramAction = async (input: SaveProgramInput) => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    return { error: "UNAUTHORIZED", success: false };
  }

  const limitMax = input.type === "points" ? 2000 : 30;
  const limitMin = input.type === "points" ? 5 : 1;

  const program = await upsertProgram(merchantSession.organizationId, {
    brandColor: input.brandColor,
    logoUrl: input.logoUrl,
    rewardLabel: input.rewardLabel.trim(),
    stampsRequired: Math.max(
      limitMin,
      Math.min(limitMax, input.stampsRequired)
    ),
    type: input.type ?? "stamps",
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

export interface CompleteOnboardingInput {
  brandColor: string;
  businessName: string;
  category?: string;
  logoUrl?: string;
  minSpend?: number;
  pointsPerSpend?: number;
  programType: "stamps" | "points";
  rewardLabel: string;
  targetRequired: number;
}

interface OrganizationMetadata {
  category?: string;
  minSpend?: number;
  phone?: string;
  pointsPerSpend?: number;
}

export const completeOnboardingAction = async (
  input: CompleteOnboardingInput
) => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    return { error: "UNAUTHORIZED", success: false };
  }

  // Update business name and category metadata
  const trimmedName = input.businessName.trim();
  const [existingOrg] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, merchantSession.organizationId))
    .limit(1);

  let metadataObj: OrganizationMetadata = {};
  if (existingOrg?.metadata) {
    try {
      metadataObj = JSON.parse(existingOrg.metadata) as OrganizationMetadata;
    } catch {
      metadataObj = {};
    }
  }

  if (input.category) {
    metadataObj.category = input.category;
  }
  if (input.pointsPerSpend) {
    metadataObj.pointsPerSpend = input.pointsPerSpend;
  }
  if (input.minSpend) {
    metadataObj.minSpend = input.minSpend;
  }

  await db
    .update(organization)
    .set({
      metadata:
        Object.keys(metadataObj).length > 0
          ? JSON.stringify(metadataObj)
          : undefined,
      name: trimmedName || merchantSession.organization.name,
    })
    .where(eq(organization.id, merchantSession.organizationId));

  const target =
    input.programType === "points"
      ? Math.max(5, Math.min(2000, input.targetRequired))
      : Math.max(1, Math.min(30, input.targetRequired));

  const program = await upsertProgram(merchantSession.organizationId, {
    brandColor: input.brandColor,
    logoUrl: input.logoUrl,
    rewardLabel: input.rewardLabel.trim(),
    stampsRequired: target,
    type: input.programType,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/program");
  revalidatePath("/onboarding");

  return { program, success: true };
};
