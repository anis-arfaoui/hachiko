"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization, upsertProgram } from "@/dal/program";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";

export interface OrganizationMetadata {
  bgImageUrl?: string;
  category?: string;
  googleReviewBonus?: number;
  googleReviewEnabled?: boolean;
  googleReviewUrl?: string;
  minSpend?: number;
  phone?: string;
  pointsExpiryDays?: number;
  pointsPerSpend?: number;
  referralBonus?: number;
  stampIcon?: string;
}

export interface ProgramAndOrgDetails {
  org: {
    id: string;
    logo: string | null;
    metadata: OrganizationMetadata;
    name: string;
  };
  program: {
    brandColor: string;
    id: string;
    logoUrl: string | null;
    rewardLabel: string;
    stampsRequired: number;
    type: string;
  } | null;
}

export const getProgramAndOrgDetailsAction =
  async (): Promise<ProgramAndOrgDetails | null> => {
    const merchantSession = await getMerchantSession();

    if (!merchantSession) {
      return null;
    }

    const [program, orgList] = await Promise.all([
      getProgramByOrganization(merchantSession.organizationId),
      db
        .select({
          id: organization.id,
          logo: organization.logo,
          metadata: organization.metadata,
          name: organization.name,
        })
        .from(organization)
        .where(eq(organization.id, merchantSession.organizationId))
        .limit(1),
    ]);

    const [orgRecord] = orgList;
    if (!orgRecord) {
      return null;
    }

    let metadataObj: OrganizationMetadata = {};
    if (orgRecord.metadata) {
      try {
        metadataObj = JSON.parse(orgRecord.metadata) as OrganizationMetadata;
      } catch {
        metadataObj = {};
      }
    }

    return {
      org: {
        id: orgRecord.id,
        logo: orgRecord.logo,
        metadata: metadataObj,
        name: orgRecord.name,
      },
      program: program
        ? {
            brandColor: program.brandColor,
            id: program.id,
            logoUrl: program.logoUrl,
            rewardLabel: program.rewardLabel,
            stampsRequired: program.stampsRequired,
            type: program.type,
          }
        : null,
    };
  };

export interface SaveProgramLogicInput {
  googleReviewBonus?: number;
  googleReviewEnabled?: boolean;
  googleReviewUrl?: string;
  minSpend?: number;
  pointsExpiryDays?: number;
  pointsPerSpend?: number;
  referralBonus?: number;
  rewardLabel: string;
  stampIcon?: string;
  stampsRequired: number;
  type: "stamps" | "points";
}

export const saveProgramLogicAction = async (input: SaveProgramLogicInput) => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    return { error: "UNAUTHORIZED", success: false };
  }

  const [orgRecord] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, merchantSession.organizationId))
    .limit(1);

  let metadataObj: OrganizationMetadata = {};
  if (orgRecord?.metadata) {
    try {
      metadataObj = JSON.parse(orgRecord.metadata) as OrganizationMetadata;
    } catch {
      metadataObj = {};
    }
  }

  if (input.stampIcon !== undefined) {
    metadataObj.stampIcon = input.stampIcon;
  }
  if (input.referralBonus !== undefined) {
    metadataObj.referralBonus = input.referralBonus;
  }
  if (input.googleReviewEnabled !== undefined) {
    metadataObj.googleReviewEnabled = input.googleReviewEnabled;
  }
  if (input.googleReviewBonus !== undefined) {
    metadataObj.googleReviewBonus = input.googleReviewBonus;
  }
  if (input.googleReviewUrl !== undefined) {
    metadataObj.googleReviewUrl = input.googleReviewUrl.trim();
  }
  if (input.pointsPerSpend !== undefined) {
    metadataObj.pointsPerSpend = input.pointsPerSpend;
  }
  if (input.minSpend !== undefined) {
    metadataObj.minSpend = input.minSpend;
  }
  if (input.pointsExpiryDays !== undefined) {
    metadataObj.pointsExpiryDays = input.pointsExpiryDays;
  }

  await db
    .update(organization)
    .set({
      metadata: JSON.stringify(metadataObj),
    })
    .where(eq(organization.id, merchantSession.organizationId));

  const existingProgram = await getProgramByOrganization(
    merchantSession.organizationId
  );
  const programType =
    (existingProgram?.type as "stamps" | "points") ?? input.type ?? "stamps";
  const limitMax = programType === "points" ? 5000 : 30;
  const limitMin = programType === "points" ? 5 : 2;

  const program = await upsertProgram(merchantSession.organizationId, {
    brandColor: existingProgram?.brandColor ?? "#18181b",
    logoUrl: existingProgram?.logoUrl ?? undefined,
    rewardLabel: input.rewardLabel.trim(),
    stampsRequired: Math.max(
      limitMin,
      Math.min(limitMax, input.stampsRequired)
    ),
    type: programType,
  });

  revalidatePath("/program");
  revalidatePath("/dashboard/program");
  revalidatePath("/dashboard");
  revalidatePath("/appearance");
  revalidatePath("/dashboard/appearance");

  return { program, success: true };
};

export interface SaveAppearanceInput {
  bgImageUrl?: string;
  brandColor: string;
  businessName: string;
  category: string;
  logoUrl?: string;
}

export const saveAppearanceAction = async (input: SaveAppearanceInput) => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    return { error: "UNAUTHORIZED", success: false };
  }

  const [orgRecord] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, merchantSession.organizationId))
    .limit(1);

  let metadataObj: OrganizationMetadata = {};
  if (orgRecord?.metadata) {
    try {
      metadataObj = JSON.parse(orgRecord.metadata) as OrganizationMetadata;
    } catch {
      metadataObj = {};
    }
  }

  metadataObj.category = input.category;
  if (input.bgImageUrl !== undefined) {
    metadataObj.bgImageUrl = input.bgImageUrl;
  }

  const trimmedName = input.businessName.trim();
  const normalizedLogo =
    input.logoUrl && input.logoUrl.trim().length > 0
      ? input.logoUrl.trim()
      : null;

  await db
    .update(organization)
    .set({
      logo: normalizedLogo,
      metadata: JSON.stringify(metadataObj),
      name: trimmedName || merchantSession.organization.name,
    })
    .where(eq(organization.id, merchantSession.organizationId));

  const existingProgram = await getProgramByOrganization(
    merchantSession.organizationId
  );

  const program = await upsertProgram(merchantSession.organizationId, {
    brandColor: input.brandColor,
    logoUrl: normalizedLogo,
    rewardLabel: existingProgram?.rewardLabel ?? "1 Récompense offerte",
    stampsRequired: existingProgram?.stampsRequired ?? 10,
    type: (existingProgram?.type as "stamps" | "points") ?? "stamps",
  });

  revalidatePath("/appearance");
  revalidatePath("/dashboard/appearance");
  revalidatePath("/program");
  revalidatePath("/dashboard/program");
  revalidatePath("/dashboard");

  return { program, success: true };
};

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

  const existingProgram = await getProgramByOrganization(
    merchantSession.organizationId
  );
  const programType =
    (existingProgram?.type as "stamps" | "points") ?? input.type ?? "stamps";

  const limitMax = programType === "points" ? 5000 : 30;
  const limitMin = programType === "points" ? 5 : 2;

  const program = await upsertProgram(merchantSession.organizationId, {
    brandColor: input.brandColor,
    logoUrl: input.logoUrl,
    rewardLabel: input.rewardLabel.trim(),
    stampsRequired: Math.max(
      limitMin,
      Math.min(limitMax, input.stampsRequired)
    ),
    type: programType,
  });

  revalidatePath("/program");
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
  revalidatePath("/program");
  revalidatePath("/dashboard/program");
  revalidatePath("/onboarding");

  return { program, success: true };
};
