import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  cards,
  customers,
  programs,
  redemptions,
  transactions,
} from "@/db/schema/loyalty";
import { normalizeAlgerianPhone } from "@/lib/phone";

export interface CustomerInput {
  name: string;
  phone: string;
}

const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const generateCustomerCode = async (
  organizationId: string
): Promise<string> => {
  const candidates: string[] = [];
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let randomPart = "";
    for (let i = 0; i < 6; i += 1) {
      const idx = Math.floor(Math.random() * CODE_CHARS.length);
      randomPart += CODE_CHARS[idx];
    }
    candidates.push(`C-${randomPart}`);
  }

  const existingRows = await db
    .select({ code: customers.code })
    .from(customers)
    .where(
      and(
        eq(customers.organizationId, organizationId),
        inArray(customers.code, candidates)
      )
    );

  const existingSet = new Set(existingRows.map((r) => r.code));
  for (const candidate of candidates) {
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  return `C-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
};

export const findOrCreateCustomer = async (
  organizationId: string,
  input: CustomerInput
) => {
  const normalizedPhone = normalizeAlgerianPhone(input.phone);

  const existing = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.organizationId, organizationId),
        eq(customers.phone, normalizedPhone)
      )
    )
    .limit(1);

  if (existing[0]) {
    // Backfill code if existing customer doesn't have one yet
    if (!existing[0].code) {
      const code = await generateCustomerCode(organizationId);
      const [updated] = await db
        .update(customers)
        .set({ code })
        .where(eq(customers.id, existing[0].id))
        .returning();
      return updated ?? { ...existing[0], code };
    }
    return existing[0];
  }

  const code = await generateCustomerCode(organizationId);

  const inserted = await db
    .insert(customers)
    .values({
      code,
      id: crypto.randomUUID(),
      name: input.name.trim(),
      organizationId,
      phone: normalizedPhone,
    })
    .returning();

  return inserted[0];
};

export const getCustomersByOrganization = (organizationId: string) =>
  db
    .select()
    .from(customers)
    .where(eq(customers.organizationId, organizationId))
    .orderBy(desc(customers.createdAt));

export interface ClientRecentTransaction {
  amount: number;
  createdAt: Date;
  id: string;
  spendAmount: number | null;
  type: string;
}

export interface MerchantClientItem {
  balance: number;
  cardId: string | null;
  cardToken: string | null;
  code: string | null;
  createdAt: Date;
  id: string;
  isRewardReady: boolean;
  lastVisitAt: Date;
  name: string;
  phone: string;
  recentTransactions: ClientRecentTransaction[];
  status: "active" | "inactive" | "new" | "reward_ready" | "vip";
  totalRedemptions: number;
  totalSpendDA: number;
  totalVisits: number;
}

export interface MerchantClientsResult {
  clients: MerchantClientItem[];
  program: {
    brandColor: string;
    id: string;
    rewardLabel: string;
    stampsRequired: number;
    type: "points" | "stamps";
  } | null;
  stats: {
    activeClients: number;
    newClients: number;
    rewardReadyClients: number;
    totalClients: number;
    totalRedeemed: number;
    vipClients: number;
  };
}

export const getMerchantClientsWithStats = async (
  organizationId: string
): Promise<MerchantClientsResult> => {
  // 1. Fetch loyalty program for this merchant
  const [orgProgram] = await db
    .select()
    .from(programs)
    .where(eq(programs.organizationId, organizationId))
    .limit(1);

  const programType = (orgProgram?.type === "points" ? "points" : "stamps") as
    | "points"
    | "stamps";
  const targetRequired = orgProgram?.stampsRequired ?? 10;

  // 2. Fetch all customers for this organization with their loyalty card
  const allCustomers = await db
    .select({
      cardBalance: cards.balance,
      cardId: cards.id,
      cardToken: cards.token,
      cardUpdatedAt: cards.updatedAt,
      code: customers.code,
      createdAt: customers.createdAt,
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
    })
    .from(customers)
    .leftJoin(
      cards,
      orgProgram
        ? and(
            eq(cards.customerId, customers.id),
            eq(cards.programId, orgProgram.id)
          )
        : eq(cards.customerId, customers.id)
    )
    .where(eq(customers.organizationId, organizationId))
    .orderBy(desc(customers.createdAt));

  if (!orgProgram || allCustomers.length === 0) {
    return {
      clients: allCustomers.map((c) => ({
        balance: c.cardBalance ?? 0,
        cardId: c.cardId ?? null,
        cardToken: c.cardToken ?? null,
        code: c.code,
        createdAt: c.createdAt,
        id: c.id,
        isRewardReady: false,
        lastVisitAt: c.cardUpdatedAt ?? c.createdAt,
        name: c.name,
        phone: c.phone,
        recentTransactions: [],
        status: "new",
        totalRedemptions: 0,
        totalSpendDA: 0,
        totalVisits: 0,
      })),
      program: orgProgram
        ? {
            brandColor: orgProgram.brandColor,
            id: orgProgram.id,
            rewardLabel: orgProgram.rewardLabel,
            stampsRequired: targetRequired,
            type: programType,
          }
        : null,
      stats: {
        activeClients: 0,
        newClients: allCustomers.length,
        rewardReadyClients: 0,
        totalClients: allCustomers.length,
        totalRedeemed: 0,
        vipClients: 0,
      },
    };
  }

  // 3. Fetch all transactions and redemptions for this program
  const [allTransactions, allRedemptions] = await Promise.all([
    db
      .select({
        amount: transactions.amount,
        cardId: transactions.cardId,
        createdAt: transactions.createdAt,
        id: transactions.id,
        spendAmount: transactions.spendAmount,
        type: transactions.type,
      })
      .from(transactions)
      .innerJoin(cards, eq(transactions.cardId, cards.id))
      .where(eq(cards.programId, orgProgram.id))
      .orderBy(desc(transactions.createdAt)),
    db
      .select({
        cardId: redemptions.cardId,
        createdAt: redemptions.createdAt,
        id: redemptions.id,
      })
      .from(redemptions)
      .innerJoin(cards, eq(redemptions.cardId, cards.id))
      .where(eq(cards.programId, orgProgram.id)),
  ]);

  const txByCard = new Map<string, typeof allTransactions>();
  for (const tx of allTransactions) {
    const list = txByCard.get(tx.cardId);
    if (list) {
      list.push(tx);
    } else {
      txByCard.set(tx.cardId, [tx]);
    }
  }

  const redemptionsByCard = new Map<string, number>();
  for (const r of allRedemptions) {
    redemptionsByCard.set(r.cardId, (redemptionsByCard.get(r.cardId) ?? 0) + 1);
  }

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  let activeCount = 0;
  let rewardReadyCount = 0;
  let vipCount = 0;
  let newCount = 0;

  const clients: MerchantClientItem[] = allCustomers.map((cust) => {
    const cardId = cust.cardId ?? null;
    const cardTransactions = cardId ? (txByCard.get(cardId) ?? []) : [];
    const totalRedemptions = cardId ? (redemptionsByCard.get(cardId) ?? 0) : 0;
    const totalVisits = cardTransactions.length;
    const totalSpendDA = cardTransactions.reduce(
      (sum, t) => sum + (t.spendAmount ?? 0),
      0
    );
    const balance = cust.cardBalance ?? 0;
    const isRewardReady = balance >= targetRequired;
    const lastVisitAt =
      cardTransactions[0]?.createdAt ?? cust.cardUpdatedAt ?? cust.createdAt;

    let status: "active" | "inactive" | "new" | "reward_ready" | "vip" =
      "active";
    if (isRewardReady) {
      status = "reward_ready";
      rewardReadyCount += 1;
    } else if (
      totalVisits >= 5 ||
      (programType === "points" && totalSpendDA >= 10_000)
    ) {
      status = "vip";
      vipCount += 1;
    } else if (totalVisits <= 1 && cust.createdAt >= thirtyDaysAgo) {
      status = "new";
      newCount += 1;
    } else if (lastVisitAt < thirtyDaysAgo) {
      status = "inactive";
    } else {
      status = "active";
      activeCount += 1;
    }

    return {
      balance,
      cardId,
      cardToken: cust.cardToken ?? null,
      code: cust.code,
      createdAt: cust.createdAt,
      id: cust.id,
      isRewardReady,
      lastVisitAt,
      name: cust.name,
      phone: cust.phone,
      recentTransactions: cardTransactions.slice(0, 5),
      status,
      totalRedemptions,
      totalSpendDA,
      totalVisits,
    };
  });

  return {
    clients,
    program: {
      brandColor: orgProgram.brandColor,
      id: orgProgram.id,
      rewardLabel: orgProgram.rewardLabel,
      stampsRequired: targetRequired,
      type: programType,
    },
    stats: {
      activeClients: activeCount,
      newClients: newCount,
      rewardReadyClients: rewardReadyCount,
      totalClients: allCustomers.length,
      totalRedeemed: allRedemptions.length,
      vipClients: vipCount,
    },
  };
};
