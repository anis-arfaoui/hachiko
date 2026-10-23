"use server";

import { revalidatePath } from "next/cache";

import { getMerchantSession } from "@/dal/merchant";
import {
  getBroadcastAudienceStats,
  getNotificationHistory,
  sendManualBroadcastNotification,
} from "@/dal/notification";
import type {
  BroadcastAudienceStats,
  NotificationItem,
} from "@/dal/notification";

export interface SendManualNotificationInput {
  actionUrl?: string | null;
  message: string;
  title: string;
}

export interface SendManualNotificationResult {
  error?: string;
  notification?: NotificationItem;
  success: boolean;
}

export interface NotificationDashboardData {
  error?: string;
  history: NotificationItem[];
  stats: BroadcastAudienceStats | null;
  success: boolean;
}

export const getNotificationDashboardDataAction =
  async (): Promise<NotificationDashboardData> => {
    const session = await getMerchantSession();
    if (!session) {
      return {
        error: "UNAUTHORIZED",
        history: [],
        stats: null,
        success: false,
      };
    }

    try {
      const [stats, history] = await Promise.all([
        getBroadcastAudienceStats(session.organizationId),
        getNotificationHistory(session.organizationId),
      ]);

      return {
        history,
        stats,
        success: true,
      };
    } catch (error) {
      console.error("[getNotificationDashboardDataAction] Error:", error);
      return {
        error: "FAILED_TO_LOAD_DATA",
        history: [],
        stats: null,
        success: false,
      };
    }
  };

export const sendManualNotificationAction = async (
  input: SendManualNotificationInput
): Promise<SendManualNotificationResult> => {
  const session = await getMerchantSession();
  if (!session) {
    return {
      error: "Vous devez être connecté pour envoyer une notification.",
      success: false,
    };
  }

  const result = await sendManualBroadcastNotification({
    actionUrl: input.actionUrl,
    message: input.message,
    organizationId: session.organizationId,
    title: input.title,
  });

  if (!result.success) {
    return {
      error: result.message || "Erreur lors de l'envoi de la notification.",
      success: false,
    };
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");

  return {
    notification: result.notification,
    success: true,
  };
};
