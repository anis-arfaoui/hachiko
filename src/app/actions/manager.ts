"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  MANAGER_COOKIE_NAME,
  createManager,
  deleteManager,
  getManagerByCode,
  getManagerByToken,
  getManagersByOrganization,
  regenerateManagerCode,
} from "@/dal/manager";
import type { ManagerItem } from "@/dal/manager";
import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { managers } from "@/db/schema/loyalty";

export interface CreateManagerResult {
  error?: string;
  manager?: ManagerItem;
  success: boolean;
}

export const createManagerAction = async (
  name: string
): Promise<CreateManagerResult> => {
  const merchantSession = await getMerchantSession();
  if (!merchantSession) {
    return { error: "UNAUTHORIZED", success: false };
  }

  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    return {
      error: "Veuillez entrer un prénom d'au moins 2 caractères.",
      success: false,
    };
  }

  try {
    const manager = await createManager(
      merchantSession.organizationId,
      trimmed
    );
    revalidatePath("/responsables");
    revalidatePath("/dashboard");
    return { manager, success: true };
  } catch (error) {
    console.error("Create manager error:", error);
    return {
      error: "Erreur lors de la création du responsable.",
      success: false,
    };
  }
};

export const deleteManagerAction = async (
  managerId: string
): Promise<{ error?: string; success: boolean }> => {
  const merchantSession = await getMerchantSession();
  if (!merchantSession) {
    return { error: "UNAUTHORIZED", success: false };
  }

  try {
    const deleted = await deleteManager(
      merchantSession.organizationId,
      managerId
    );
    revalidatePath("/responsables");
    revalidatePath("/dashboard");
    return { success: deleted };
  } catch (error) {
    console.error("Delete manager error:", error);
    return { error: "Erreur lors de la suppression.", success: false };
  }
};

export const regenerateManagerCodeAction = async (
  managerId: string
): Promise<{ error?: string; manager?: ManagerItem; success: boolean }> => {
  const merchantSession = await getMerchantSession();
  if (!merchantSession) {
    return { error: "UNAUTHORIZED", success: false };
  }

  try {
    const manager = await regenerateManagerCode(
      merchantSession.organizationId,
      managerId
    );
    if (!manager) {
      return { error: "Responsable non trouvé.", success: false };
    }
    revalidatePath("/responsables");
    return { manager, success: true };
  } catch (error) {
    console.error("Regenerate manager code error:", error);
    return {
      error: "Erreur lors de la génération d'un nouveau code.",
      success: false,
    };
  }
};

export const getManagersDataAction = async (): Promise<ManagerItem[]> => {
  const merchantSession = await getMerchantSession();
  if (!merchantSession) {
    return [];
  }

  return getManagersByOrganization(merchantSession.organizationId);
};

export interface VerifyManagerResult {
  error?: string;
  manager?: {
    code: string;
    id: string;
    name: string;
    token: string;
  };
  organization?: {
    id: string;
    logo: string | null;
    name: string;
    slug: string | null;
  };
  program?: {
    brandColor: string;
    id: string;
    rewardLabel: string;
    stampsRequired: number;
    type: "points" | "stamps";
  };
  success: boolean;
}

// eslint-disable-next-line react-doctor/server-auth-actions
export const verifyManagerCodeAction = async (
  codeOrToken: string
): Promise<VerifyManagerResult> => {
  const trimmed = codeOrToken.trim();
  if (!trimmed) {
    return { error: "Code requis.", success: false };
  }

  // Lookup by 6-digit code or secure token
  let manager = await getManagerByCode(trimmed);
  if (!manager) {
    manager = await getManagerByToken(trimmed);
  }

  if (!manager) {
    return {
      error:
        "Code invalide. Vérifiez le code à 6 chiffres affiché par le gérant.",
      success: false,
    };
  }

  const [orgRow, program] = await Promise.all([
    db
      .select({
        id: organization.id,
        logo: organization.logo,
        name: organization.name,
        slug: organization.slug,
      })
      .from(organization)
      .where(eq(organization.id, manager.organizationId))
      .limit(1),
    getProgramByOrganization(manager.organizationId),
  ]);

  if (!orgRow[0]) {
    return {
      error: "Commerce introuvable.",
      success: false,
    };
  }

  // Update lastActiveAt
  await db
    .update(managers)
    .set({ lastActiveAt: new Date() })
    .where(eq(managers.id, manager.id));

  // Set manager session cookie (30 days)
  const cookieStore = await cookies();
  cookieStore.set(MANAGER_COOKIE_NAME, manager.token, {
    httpOnly: true,
    // 30 days
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return {
    manager: {
      code: manager.code,
      id: manager.id,
      name: manager.name,
      token: manager.token,
    },
    organization: orgRow[0],
    program: program
      ? {
          brandColor: program.brandColor,
          id: program.id,
          rewardLabel: program.rewardLabel,
          stampsRequired: program.stampsRequired,
          type: program.type === "points" ? "points" : "stamps",
        }
      : undefined,
    success: true,
  };
};

export const logoutManagerAction = async (): Promise<{ success: boolean }> => {
  const cookieStore = await cookies();
  cookieStore.delete(MANAGER_COOKIE_NAME);
  revalidatePath("/responsable");
  return { success: true };
};
