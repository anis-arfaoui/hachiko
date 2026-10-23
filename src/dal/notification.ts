import { and, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import {
  appleWalletRegistrations,
  cards,
  notifications,
  programs,
} from "@/db/schema/loyalty";
import { broadcastAppleWalletNotification } from "@/lib/wallet/apple";
import { broadcastGoogleWalletNotification } from "@/lib/wallet/google";

export const DAILY_NOTIFICATION_LIMIT = 3;

export interface NotificationItem {
  actionUrl: string | null;
  channel: string;
  createdAt: Date;
  id: string;
  message: string;
  recipientCount: number;
  sentAt: Date;
  title: string;
  type: string;
}

export interface BroadcastAudienceStats {
  appleDevices: number;
  remainingToday: number;
  totalCards: number;
  usedToday: number;
}

export interface SendBroadcastNotificationOptions {
  actionUrl?: string | null;
  message: string;
  organizationId: string;
  title: string;
}

export type SendBroadcastNotificationResult =
  | {
      error: "PROGRAM_NOT_FOUND" | "QUOTA_EXCEEDED" | "VALIDATION_FAILED";
      message?: string;
      success: false;
    }
  | {
      notification: NotificationItem;
      success: true;
    };

/**
 * Returns how many manual notifications were sent today (since 00:00:00 local/UTC).
 */
export const getTodayNotificationCount = async (
  organizationId: string
): Promise<number> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todaysNotifications = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.type, "manual"),
        gte(notifications.sentAt, startOfDay)
      )
    );

  return todaysNotifications.length;
};

/**
 * Returns audience metrics and daily quota for the merchant dashboard.
 */
export const getBroadcastAudienceStats = async (
  organizationId: string
): Promise<BroadcastAudienceStats> => {
  const [usedToday, totalCardsList, appleList] = await Promise.all([
    getTodayNotificationCount(organizationId),
    db
      .select({ id: cards.id })
      .from(cards)
      .innerJoin(programs, eq(programs.id, cards.programId))
      .where(eq(programs.organizationId, organizationId)),
    db
      .select({ id: appleWalletRegistrations.id })
      .from(appleWalletRegistrations)
      .innerJoin(cards, eq(cards.id, appleWalletRegistrations.serialNumber))
      .innerJoin(programs, eq(programs.id, cards.programId))
      .where(eq(programs.organizationId, organizationId)),
  ]);

  return {
    appleDevices: appleList.length,
    remainingToday: Math.max(0, DAILY_NOTIFICATION_LIMIT - usedToday),
    totalCards: totalCardsList.length,
    usedToday,
  };
};

/**
 * Fetches recent notification history for an organization.
 */
export const getNotificationHistory = (
  organizationId: string
): Promise<NotificationItem[]> =>
  db
    .select({
      actionUrl: notifications.actionUrl,
      channel: notifications.channel,
      createdAt: notifications.createdAt,
      id: notifications.id,
      message: notifications.message,
      recipientCount: notifications.recipientCount,
      sentAt: notifications.sentAt,
      title: notifications.title,
      type: notifications.type,
    })
    .from(notifications)
    .where(eq(notifications.organizationId, organizationId))
    .orderBy(desc(notifications.sentAt))
    .limit(50);

/**
 * Dispatches a manual push notification to all Google Wallet & Apple Wallet pass holders.
 */
export const sendManualBroadcastNotification = async (
  options: SendBroadcastNotificationOptions
): Promise<SendBroadcastNotificationResult> => {
  const title = options.title.trim();
  const message = options.message.trim();
  const actionUrl = options.actionUrl?.trim() || null;

  if (!title || title.length > 50 || !message || message.length > 150) {
    return {
      error: "VALIDATION_FAILED",
      message:
        "Le titre doit faire max 50 caractères et le message max 150 caractères.",
      success: false,
    };
  }

  // 1. Check anti-spam quota (max 3/day)
  const usedToday = await getTodayNotificationCount(options.organizationId);
  if (usedToday >= DAILY_NOTIFICATION_LIMIT) {
    return {
      error: "QUOTA_EXCEEDED",
      message: `Quota quotidien atteint (${DAILY_NOTIFICATION_LIMIT}/3 aujourd'hui). Réessayez demain pour éviter la lassitude de vos clients.`,
      success: false,
    };
  }

  // 2. Fetch program
  const [program] = await db
    .select()
    .from(programs)
    .where(eq(programs.organizationId, options.organizationId))
    .limit(1);

  if (!program) {
    return {
      error: "PROGRAM_NOT_FOUND",
      message: "Programme de fidélité introuvable.",
      success: false,
    };
  }

  // 3. Broadcast to Google Wallet and Apple Wallet, and count recipients in parallel
  const [_googleResult, _appleResult, totalCardsList] = await Promise.all([
    broadcastGoogleWalletNotification({
      actionUrl,
      body: message,
      header: title,
      programId: program.id,
    }),
    broadcastAppleWalletNotification(program.id),
    db
      .select({ id: cards.id })
      .from(cards)
      .where(eq(cards.programId, program.id)),
  ]);

  const recipientCount = totalCardsList.length;
  const notificationId = crypto.randomUUID();
  const now = new Date();

  // 4. Save notification log
  const [inserted] = await db
    .insert(notifications)
    .values({
      actionUrl,
      channel: "all",
      createdAt: now,
      id: notificationId,
      message,
      organizationId: options.organizationId,
      recipientCount,
      sentAt: now,
      title,
      type: "manual",
    })
    .returning();

  return {
    notification: {
      actionUrl: inserted.actionUrl,
      channel: inserted.channel,
      createdAt: inserted.createdAt,
      id: inserted.id,
      message: inserted.message,
      recipientCount: inserted.recipientCount,
      sentAt: inserted.sentAt,
      title: inserted.title,
      type: inserted.type,
    },
    success: true,
  };
};
