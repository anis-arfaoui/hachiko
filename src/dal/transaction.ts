import { and, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import {
  cards,
  programs,
  redemptions,
  transactions,
} from "@/db/schema/loyalty";

import { getCardByToken } from "./card";

const DEFAULT_COOLDOWN_MINUTES = 3;

export interface AddStampOptions {
  amount?: number;
  clientUuid: string;
  cooldownMinutes?: number;
  ignoreCooldown?: boolean;
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

    await tx.insert(transactions).values({
      amount: increment,
      cardId: card.cardId,
      clientUuid: options.clientUuid,
      id: transactionId,
      spendAmount: options.spendAmount ?? null,
      staffUserId: options.staffUserId,
      type: txType,
    });
  });

  return {
    addedAmount: increment,
    balance: newBalance,
    customerCode: card.customerCode ?? undefined,
    isDuplicate: false,
    programType: card.programType === "points" ? "points" : "stamps",
    rewardReady: newBalance >= card.stampsRequired,
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

  return {
    newBalance: revertedBalance,
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

  const isPoints = card.programType === "points";
  const newBalance = isPoints
    ? Math.max(0, card.balance - card.stampsRequired)
    : 0;

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
    balance: newBalance,
    rewardLabel: card.rewardLabel,
    success: true,
  };
};
