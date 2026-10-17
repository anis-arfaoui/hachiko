"use server";

import { revalidatePath } from "next/cache";

import { getMerchantSession } from "@/dal/merchant";
import {
  getSubscriptionDetails,
  requestSubscription,
  setSubscriptionStatus,
} from "@/dal/subscription";
import type { SubscriptionDetails, SubscriptionInfo } from "@/dal/subscription";

export interface RequestSubscriptionInput {
  billingCycle: "mensuel" | "semestriel" | "annuel";
  hasNfcPlaque: boolean;
  plan: "starter" | "pro";
  pointsOfSale: number;
  price: number;
}

export interface RequestSubscriptionResult {
  error?: string;
  subscription?: SubscriptionInfo;
  success: boolean;
}

export const getSubscriptionDataAction =
  async (): Promise<SubscriptionDetails | null> => {
    const session = await getMerchantSession();
    if (!session) {
      return null;
    }
    return getSubscriptionDetails(session.organizationId);
  };

export const requestSubscriptionAction = async (
  input: RequestSubscriptionInput
): Promise<RequestSubscriptionResult> => {
  const session = await getMerchantSession();
  if (!session) {
    return {
      error: "Non autorisé. Veuillez vous reconnecter.",
      success: false,
    };
  }

  try {
    const updated = await requestSubscription(session.organizationId, input);
    if (!updated) {
      return {
        error: "Impossible d'enregistrer la demande d'abonnement.",
        success: false,
      };
    }

    revalidatePath("/billing");
    revalidatePath("/abonnement");
    revalidatePath("/dashboard");

    return { subscription: updated, success: true };
  } catch (error) {
    console.error("Error requesting subscription:", error);
    return {
      error: "Une erreur est survenue lors de l'enregistrement de la demande.",
      success: false,
    };
  }
};

export const adminSetSubscriptionStatusAction = async (
  status: "trial" | "pending" | "active" | "expired",
  durationMonths = 1
): Promise<{ error?: string; success: boolean }> => {
  const session = await getMerchantSession();
  if (!session) {
    return { error: "Non autorisé.", success: false };
  }

  try {
    await setSubscriptionStatus(session.organizationId, status, durationMonths);
    revalidatePath("/billing");
    revalidatePath("/abonnement");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error setting subscription status:", error);
    return {
      error: "Erreur lors de la modification du statut.",
      success: false,
    };
  }
};
