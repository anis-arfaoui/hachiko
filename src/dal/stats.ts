import { count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  cards,
  customers,
  programs,
  redemptions,
  transactions,
} from "@/db/schema/loyalty";

export interface RecentActivityItem {
  amount: number;
  createdAt: Date;
  customerName: string;
  id: string;
  type: string;
}

export interface MerchantStats {
  recentActivity: RecentActivityItem[];
  totalCustomers: number;
  totalRewardsRedeemed: number;
  totalStamps: number;
}

export const getMerchantStats = async (
  organizationId: string
): Promise<MerchantStats> => {
  // Total customers
  const customersCountRes = await db
    .select({ count: count() })
    .from(customers)
    .where(eq(customers.organizationId, organizationId));

  const totalCustomers = customersCountRes[0]?.count ?? 0;

  // Total stamps & redemptions via cards belonging to this organization's programs
  const orgProgram = await db
    .select({ id: programs.id })
    .from(programs)
    .where(eq(programs.organizationId, organizationId))
    .limit(1);

  if (!orgProgram[0]) {
    return {
      recentActivity: [],
      totalCustomers,
      totalRewardsRedeemed: 0,
      totalStamps: 0,
    };
  }

  const programId = orgProgram[0].id;

  const stampsCountRes = await db
    .select({ count: count() })
    .from(transactions)
    .innerJoin(cards, eq(transactions.cardId, cards.id))
    .where(eq(cards.programId, programId));

  const totalStamps = stampsCountRes[0]?.count ?? 0;

  const redemptionsCountRes = await db
    .select({ count: count() })
    .from(redemptions)
    .innerJoin(cards, eq(redemptions.cardId, cards.id))
    .where(eq(cards.programId, programId));

  const totalRewardsRedeemed = redemptionsCountRes[0]?.count ?? 0;

  const recentTransactions = await db
    .select({
      amount: transactions.amount,
      createdAt: transactions.createdAt,
      customerName: customers.name,
      id: transactions.id,
      type: transactions.type,
    })
    .from(transactions)
    .innerJoin(cards, eq(transactions.cardId, cards.id))
    .innerJoin(customers, eq(cards.customerId, customers.id))
    .where(eq(cards.programId, programId))
    .orderBy(desc(transactions.createdAt))
    .limit(10);

  return {
    recentActivity: recentTransactions,
    totalCustomers,
    totalRewardsRedeemed,
    totalStamps,
  };
};
