"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getMerchantSession } from "@/dal/merchant";
import {
  getEstablishmentDetails,
  updateEstablishmentDetails,
} from "@/dal/settings";
import type { EstablishmentDetails } from "@/dal/settings";
import { db } from "@/db";
import { organization, user } from "@/db/schema/auth";
import { auth } from "@/lib/auth";

export interface UpdateEstablishmentResult {
  details?: EstablishmentDetails;
  error?: string;
  success: boolean;
}

export const getEstablishmentAction =
  async (): Promise<EstablishmentDetails | null> => {
    const session = await getMerchantSession();
    if (!session) {
      return null;
    }
    return getEstablishmentDetails(session.organizationId);
  };

export const updateEstablishmentAction = async (details: {
  activityType: string;
  address: string;
  city: string;
  description: string;
  name: string;
  phone: string;
}): Promise<UpdateEstablishmentResult> => {
  const session = await getMerchantSession();
  if (!session) {
    return {
      error: "Non autorisé. Veuillez vous reconnecter.",
      success: false,
    };
  }

  const trimmedName = details.name.trim();
  if (!trimmedName || trimmedName.length < 2) {
    return {
      error: "Le nom de l'établissement doit contenir au moins 2 caractères.",
      success: false,
    };
  }

  try {
    const updated = await updateEstablishmentDetails(
      session.organizationId,
      details
    );
    if (!updated) {
      return {
        error: "Impossible de mettre à jour l'établissement.",
        success: false,
      };
    }

    revalidatePath("/settings");
    revalidatePath("/parametres");
    revalidatePath("/dashboard");
    revalidatePath("/program");
    revalidatePath("/appearance");

    return { details: updated, success: true };
  } catch (error) {
    console.error("Error updating establishment:", error);
    return {
      error: "Une erreur est survenue lors de l'enregistrement.",
      success: false,
    };
  }
};

export interface ChangePasswordResult {
  error?: string;
  success: boolean;
}

export const changePasswordAction = async (
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> => {
  const session = await getMerchantSession();
  if (!session) {
    return {
      error: "Non autorisé. Veuillez vous reconnecter.",
      success: false,
    };
  }

  if (!currentPassword) {
    return {
      error: "Veuillez entrer votre mot de passe actuel.",
      success: false,
    };
  }

  if (!newPassword || newPassword.length < 8) {
    return {
      error: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      success: false,
    };
  }

  try {
    const reqHeaders = await headers();
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      },
      headers: reqHeaders,
    });

    return { success: true };
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error
        ? error.message
        : "Erreur lors du changement de mot de passe.";
    // Friendly error message for invalid password
    if (
      errMessage.toLowerCase().includes("invalid") ||
      errMessage.toLowerCase().includes("incorrect") ||
      errMessage.toLowerCase().includes("credentials")
    ) {
      return {
        error: "Mot de passe actuel incorrect. Veuillez vérifier et réessayer.",
        success: false,
      };
    }
    return {
      error:
        errMessage || "Impossible de changer le mot de passe pour le moment.",
      success: false,
    };
  }
};

export interface DeleteAccountResult {
  error?: string;
  success: boolean;
}

export const deleteAccountAction = async (
  confirmBusinessName: string
): Promise<DeleteAccountResult> => {
  const session = await getMerchantSession();
  if (!session) {
    return { error: "Non autorisé.", success: false };
  }

  if (confirmBusinessName.trim() !== session.organization.name.trim()) {
    return {
      error: "Le nom saisi ne correspond pas au nom de votre établissement.",
      success: false,
    };
  }

  try {
    const reqHeaders = await headers();

    // 1. Delete organization (cascades all loyalty data: cards, customers, programs, rewards, cashiers, managers, etc.)
    await db
      .delete(organization)
      .where(eq(organization.id, session.organizationId));

    // 2. Delete the user account (cascades sessions and accounts)
    await db.delete(user).where(eq(user.id, session.userId));

    // 3. Sign out the user from auth session
    try {
      await auth.api.signOut({ headers: reqHeaders });
    } catch {
      // ignore sign out cleanup error
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      error: "Une erreur est survenue lors de la suppression de votre compte.",
      success: false,
    };
  }
};
