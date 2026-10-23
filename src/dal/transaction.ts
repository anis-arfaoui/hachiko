import { and, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import {
  cards,
  cashiers,
  programs,
  redemptions,
  rewards,
  transactions,
} from "@/db/schema/loyalty";
import { syncAppleWalletCard } from "@/lib/wallet/apple";
import { syncGoogleWalletCard } from "@/lib/wallet/google";

import { getCardByToken } from "./card";

const DEFAULT_COOLDOWN_MINUTES = 3;

export interface AddStampOptions {
  amount?: number;
  cashierId?: string;
  clientUuid: string;
  cooldownMinutes?: number;
  ignoreCooldown?: boolean;
  locationId?: string;
  organizationId: string;
  spendAmount?: number;
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
      addedAmount: number;
      balance: number;
      customerCode?: string;
      isDuplicate: boolean;
      programType: "stamps" | "points";
      rewardReady: boolean;
      stampsRequired: number;
      success: true;
      transactionId: string;
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

  const isPoints = card.programType === "points";
  const defaultIncrement = isPoints ? 10 : 1;
  const increment = options.amount ?? defaultIncrement;
  const txType = isPoints ? "points" : "stamp";

  // Idempotency check: prevent duplicate transactions if the same clientUuid is submitted
  const existingTx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.clientUuid, options.clientUuid))
    .limit(1);

  if (existingTx[0]) {
    return {
      addedAmount: existingTx[0].amount,
      balance: card.balance,
      customerCode: card.customerCode ?? undefined,
      isDuplicate: true,
      programType: card.programType === "points" ? "points" : "stamps",
      rewardReady: card.balance >= card.stampsRequired,
      stampsRequired: card.stampsRequired,
      success: true,
      transactionId: existingTx[0].id,
    };
  }

  // Cooldown check: prevent accidental double-scans of the same card within the cooldown window (unless bypassed)
  if (!options.ignoreCooldown) {
    const cooldownMin = options.cooldownMinutes ?? DEFAULT_COOLDOWN_MINUTES;
    const recentTx = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.cardId, card.cardId),
          or(eq(transactions.type, "stamp"), eq(transactions.type, "points"))
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(1);

    if (recentTx[0]) {
      const elapsedMs = Date.now() - recentTx[0].createdAt.getTime();
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
  }

  const newBalance = card.balance + increment;
  const transactionId = crypto.randomUUID();

  // Atomic database update
  await db.transaction(async (tx) => {
    await tx
      .update(cards)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, card.cardId));

    let locId = options.locationId ?? null;
    if (!locId && options.cashierId) {
      const [c] = await tx
        .select({ locationId: cashiers.locationId })
        .from(cashiers)
        .where(eq(cashiers.id, options.cashierId))
        .limit(1);
      locId = c?.locationId ?? null;
    }

    await tx.insert(transactions).values({
      amount: increment,
      cardId: card.cardId,
      cashierId: options.cashierId ?? null,
      clientUuid: options.clientUuid,
      id: transactionId,
      locationId: locId,
      spendAmount: options.spendAmount ?? null,
      staffUserId: options.staffUserId,
      type: txType,
    });

    if (options.cashierId) {
      await tx
        .update(cashiers)
        .set({ lastActiveAt: new Date(), updatedAt: new Date() })
        .where(eq(cashiers.id, options.cashierId));
    }
  });

  const rewardReady = newBalance >= card.stampsRequired;

  // Reliably sync pass balance on Google & Apple Wallet silently without push notification spam
  await Promise.allSettled([
    syncGoogleWalletCard({
      balance: newBalance,
      businessName: card.businessName,
      cardId: card.cardId,
      programType: card.programType,
      rewardLabel: card.rewardLabel ?? undefined,
      stampsRequired: card.stampsRequired,
    }),
    syncAppleWalletCard({ cardId: card.cardId }),
  ]);

  return {
    addedAmount: increment,
    balance: newBalance,
    customerCode: card.customerCode ?? undefined,
    isDuplicate: false,
    programType: card.programType === "points" ? "points" : "stamps",
    rewardReady,
    stampsRequired: card.stampsRequired,
    success: true,
    transactionId,
  };
};

export interface CancelTransactionOptions {
  organizationId: string;
  staffUserId?: string;
  transactionId: string;
}

export type CancelTransactionResult =
  | {
      error: "TRANSACTION_NOT_FOUND" | "UNAUTHORIZED_ORGANIZATION";
      success: false;
    }
  | {
      newBalance: number;
      success: true;
    };

export const cancelTransaction = async (
  options: CancelTransactionOptions
): Promise<CancelTransactionResult> => {
  const rows = await db
    .select({
      amount: transactions.amount,
      balance: cards.balance,
      cardId: cards.id,
      organizationId: programs.organizationId,
      txId: transactions.id,
      type: transactions.type,
    })
    .from(transactions)
    .innerJoin(cards, eq(transactions.cardId, cards.id))
    .innerJoin(programs, eq(cards.programId, programs.id))
    .where(eq(transactions.id, options.transactionId))
    .limit(1);

  const [txRecord] = rows;
  if (!txRecord) {
    return { error: "TRANSACTION_NOT_FOUND", success: false };
  }

  if (txRecord.organizationId !== options.organizationId) {
    return { error: "UNAUTHORIZED_ORGANIZATION", success: false };
  }

  const revertedBalance = Math.max(0, txRecord.balance - txRecord.amount);

  await db.transaction(async (tx) => {
    await tx
      .update(cards)
      .set({
        balance: revertedBalance,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, txRecord.cardId));

    await tx.delete(transactions).where(eq(transactions.id, txRecord.txId));
  });

  // Asynchronously sync pass on Google & Apple Wallet
  void syncGoogleWalletCard({
    balance: revertedBalance,
    cardId: txRecord.cardId,
  });
  void syncAppleWalletCard({ cardId: txRecord.cardId });

  return {
    newBalance: revertedBalance,
    success: true,
  };
};

export interface RedeemRewardOptions {
  cashierId?: string;
  organizationId: string;
  rewardId?: string;
  staffUserId?: string;
  token: string;
}

export type RedeemRewardResult =
  | {
      error:
        | "CARD_NOT_FOUND"
        | "UNAUTHORIZED_ORGANIZATION"
        | "INSUFFICIENT_STAMPS"
        | "REWARD_NOT_FOUND";
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

  let { stampsRequired: rewardCost, rewardLabel } = card;
  let selectedRewardId: string | null = null;

  if (options.rewardId) {
    const [foundReward] = await db
      .select()
      .from(rewards)
      .where(
        and(
          eq(rewards.id, options.rewardId),
          eq(rewards.programId, card.programId)
        )
      )
      .limit(1);

    if (!foundReward) {
      return { error: "REWARD_NOT_FOUND", success: false };
    }

    rewardCost = foundReward.cost;
    rewardLabel = foundReward.label;
    selectedRewardId = foundReward.id;
  }

  if (card.balance < rewardCost) {
    return { error: "INSUFFICIENT_STAMPS", success: false };
  }

  // Deduct reward cost from card balance
  const newBalance = Math.max(0, card.balance - rewardCost);

  await db.transaction(async (tx) => {
    await tx
      .update(cards)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, card.cardId));

    await tx.insert(redemptions).values({
      cardId: card.cardId,
      cashierId: options.cashierId ?? null,
      id: crypto.randomUUID(),
      rewardId: selectedRewardId,
      staffUserId: options.staffUserId,
    });

    await tx.insert(transactions).values({
      amount: rewardCost,
      cardId: card.cardId,
      cashierId: options.cashierId ?? null,
      clientUuid: crypto.randomUUID(),
      id: crypto.randomUUID(),
      staffUserId: options.staffUserId,
      type: "reset",
    });

    if (options.cashierId) {
      await tx
        .update(cashiers)
        .set({ lastActiveAt: new Date(), updatedAt: new Date() })
        .where(eq(cashiers.id, options.cashierId));
    }
  });

  const isPointsRedeem = card.programType === "points";
  const redeemUnit = isPointsRedeem ? "pts" : "tampons";

  // Reliably sync pass on Google & Apple Wallet with push notification before returning
  await Promise.allSettled([
    syncGoogleWalletCard({
      balance: newBalance,
      businessName: card.businessName,
      cardId: card.cardId,
      notificationMessage: {
        body: `Votre récompense "${rewardLabel}" a été validée avec succès chez ${card.businessName}. Nouveau solde : ${newBalance} / ${card.stampsRequired} ${redeemUnit}.`,
        header: "Récompense validée ! ☕",
      },
      programType: card.programType,
      rewardLabel: card.rewardLabel ?? undefined,
      stampsRequired: card.stampsRequired,
    }),
    syncAppleWalletCard({ cardId: card.cardId }),
  ]);

  return {
    balance: newBalance,
    rewardLabel,
    success: true,
  };
};
