import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { cards, redemptions, transactions } from "@/db/schema/loyalty";

import { getCardByToken } from "./card";

const DEFAULT_COOLDOWN_MINUTES = 3;

export interface AddStampOptions {
  clientUuid: string;
  cooldownMinutes?: number;
  organizationId: string;
  staffUserId?: string;
  token: string;
}

export type AddStampResult =
  | {
      error: "CARD_NOT_FOUND" | "UNAUTHORIZED_ORGANIZATION";
      success: false;
    }
  | {
      error: "COOLDOWN_ACTIVE";
      remainingSeconds: number;
      success: false;
    }
  | {
      balance: number;
      isDuplicate: boolean;
      rewardReady: boolean;
      stampsRequired: number;
      success: true;
    };

export const addStampToCard = async (
  options: AddStampOptions
): Promise<AddStampResult> => {
  const card = await getCardByToken(options.token);

  if (!card) {
    return { error: "CARD_NOT_FOUND", success: false };
  }

  if (card.businessId !== options.organizationId) {
    return { error: "UNAUTHORIZED_ORGANIZATION", success: false };
  }

  // Idempotency check: prevent duplicate transactions if the same clientUuid is submitted
  const existingTx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.clientUuid, options.clientUuid))
    .limit(1);

  if (existingTx[0]) {
    return {
      balance: card.balance,
      isDuplicate: true,
      rewardReady: card.balance >= card.stampsRequired,
      stampsRequired: card.stampsRequired,
      success: true,
    };
  }

  // Cooldown check: prevent accidental double-scans of the same card within the cooldown window
  const cooldownMin = options.cooldownMinutes ?? DEFAULT_COOLDOWN_MINUTES;
  const recentStamps = await db
    .select()
    .from(transactions)
    .where(
      and(eq(transactions.cardId, card.cardId), eq(transactions.type, "stamp"))
    )
    .orderBy(desc(transactions.createdAt))
    .limit(1);

  if (recentStamps[0]) {
    const elapsedMs = Date.now() - recentStamps[0].createdAt.getTime();
    const cooldownMs = cooldownMin * 60 * 1000;

    if (elapsedMs < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
      return {
        error: "COOLDOWN_ACTIVE",
        remainingSeconds,
        success: false,
      };
    }
  }

  const newBalance = card.balance + 1;

  // Atomic database update
  await db.transaction(async (tx) => {
    await tx
      .update(cards)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, card.cardId));

    await tx.insert(transactions).values({
      amount: 1,
      cardId: card.cardId,
      clientUuid: options.clientUuid,
      id: crypto.randomUUID(),
      staffUserId: options.staffUserId,
      type: "stamp",
    });
  });

  return {
    balance: newBalance,
    isDuplicate: false,
    rewardReady: newBalance >= card.stampsRequired,
    stampsRequired: card.stampsRequired,
    success: true,
  };
};

export interface RedeemRewardOptions {
  organizationId: string;
  staffUserId?: string;
  token: string;
}

export type RedeemRewardResult =
  | {
      error:
        | "CARD_NOT_FOUND"
        | "UNAUTHORIZED_ORGANIZATION"
        | "INSUFFICIENT_STAMPS";
      success: false;
    }
  | {
      balance: number;
      rewardLabel: string;
      success: true;
    };

export const redeemCardReward = async (
  options: RedeemRewardOptions
): Promise<RedeemRewardResult> => {
  const card = await getCardByToken(options.token);

  if (!card) {
    return { error: "CARD_NOT_FOUND", success: false };
  }

  if (card.businessId !== options.organizationId) {
    return { error: "UNAUTHORIZED_ORGANIZATION", success: false };
  }

  if (card.balance < card.stampsRequired) {
    return { error: "INSUFFICIENT_STAMPS", success: false };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(cards)
      .set({
        balance: 0,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, card.cardId));

    await tx.insert(redemptions).values({
      cardId: card.cardId,
      id: crypto.randomUUID(),
      staffUserId: options.staffUserId,
    });

    await tx.insert(transactions).values({
      amount: 0,
      cardId: card.cardId,
      clientUuid: crypto.randomUUID(),
      id: crypto.randomUUID(),
      staffUserId: options.staffUserId,
      type: "reset",
    });
  });

  return {
    balance: 0,
    rewardLabel: card.rewardLabel,
    success: true,
  };
};
