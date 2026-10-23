"use server";

import { revalidatePath } from "next/cache";

import {
  getAutomations,
  runAutomationsForOrganization,
  saveAutomation,
} from "@/dal/automation";
import type {
  AutomationItem,
  AutomationsConfig,
  RunAutomationsResult,
  SaveAutomationInput,
} from "@/dal/automation";
import { getMerchantSession } from "@/dal/merchant";

export interface GetAutomationsResult {
  data?: AutomationsConfig;
  error?: string;
  success: boolean;
}

export interface SaveAutomationResult {
  data?: AutomationItem;
  error?: string;
  success: boolean;
}

export const getAutomationsAction = async (): Promise<GetAutomationsResult> => {
  const session = await getMerchantSession();
  if (!session) {
    return { error: "UNAUTHORIZED", success: false };
  }

  try {
    const data = await getAutomations(session.organizationId);
    return { data, success: true };
  } catch (error) {
    console.error("[getAutomationsAction] Error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des automatisations",
      success: false,
    };
  }
};

export const saveAutomationAction = async (
  input: SaveAutomationInput
): Promise<SaveAutomationResult> => {
  const session = await getMerchantSession();
  if (!session) {
    return { error: "UNAUTHORIZED", success: false };
  }

  try {
    const data = await saveAutomation(session.organizationId, input);
    revalidatePath("/automations");
    revalidatePath("/dashboard/automations");
    return { data, success: true };
  } catch (error) {
    console.error("[saveAutomationAction] Error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement de l'automatisation",
      success: false,
    };
  }
};

export const runAutomationsAction = async (): Promise<RunAutomationsResult> => {
  const session = await getMerchantSession();
  if (!session) {
    return {
      inactiveSent: 0,
      message: "Non autorisé",
      rewardSent: 0,
      success: false,
    };
  }

  try {
    const res = await runAutomationsForOrganization(session.organizationId);
    revalidatePath("/notifications");
    revalidatePath("/automations");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard/automations");
    return res;
  } catch (error) {
    console.error("[runAutomationsAction] Error:", error);
    return {
      inactiveSent: 0,
      message:
        error instanceof Error ? error.message : "Erreur lors de l'exécution",
      rewardSent: 0,
      success: false,
    };
  }
};
