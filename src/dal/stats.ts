import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import {
  cards,
  customers,
  programs,
  redemptions,
  transactions,
} from "@/db/schema/loyalty";

export interface DailyVisit {
  date: string;
  dayLabel: string;
  isToday: boolean;
  visits: number;
}

export interface TopCustomerItem {
  balance: number;
  id: string;
  name: string;
  phone: string;
  spendDA: number;
  visits: number;
}

export interface InactiveCustomerItem {
  daysInactive: number;
  id: string;
  lastVisitAt: Date;
  name: string;
  phone: string;
}

export interface RecentActivityItem {
  amount: number;
  createdAt: Date;
  customerName: string;
  deltaText: string;
  id: string;
  initials: string;
  spendText: string;
  type: "points" | "redeem" | "stamp";
  typeLabel: string;
}

export interface MerchantStats {
  dailyVisits: DailyVisit[];
  inactiveCustomers: InactiveCustomerItem[];
  peakDailyVisits: number;
  planLimit: number;
  programType: "stamps" | "points";
  recentActivity: RecentActivityItem[];
  repeatCustomersCount: number;
  repeatRate: number;
  topCustomers: TopCustomerItem[];
  totalCustomers: number;
  totalNewThisMonth: number;
  totalRevenueDA: number;
  totalRewardsRedeemed: number;
  totalTransactions: number;
  totalVisits30Days: number;
}

interface OrgMetadataParsed {
  category?: string;
  minSpend?: number;
  phone?: string;
  pointsPerSpend?: number;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/u);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "CL";
};

const formatDayKey = (d: Date): string => d.toISOString().slice(0, 10);

export const getMerchantStats = async (
  organizationId: string
): Promise<MerchantStats> => {
  const PLAN_LIMIT = 20;

  // 1. Fetch organization metadata
  const [orgRecord] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  let metadata: OrgMetadataParsed = {};
  if (orgRecord?.metadata) {
    try {
      metadata = JSON.parse(orgRecord.metadata) as OrgMetadataParsed;
    } catch {
      metadata = {};
    }
  }

  const pointsPerSpend =
    metadata.pointsPerSpend && metadata.pointsPerSpend > 0
      ? metadata.pointsPerSpend
      : 1;
  const minSpendDA =
    metadata.minSpend && metadata.minSpend > 0 ? metadata.minSpend : 200;

  // 2. Fetch program
  const [orgProgram] = await db
    .select()
    .from(programs)
    .where(eq(programs.organizationId, organizationId))
    .limit(1);

  const programType = (orgProgram?.type === "points" ? "points" : "stamps") as
    | "stamps"
    | "points";
  const stampsRequired = orgProgram?.stampsRequired ?? 10;

  // 3. Fetch all customers
  const allCustomers = await db
    .select({
      createdAt: customers.createdAt,
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
    })
    .from(customers)
    .where(eq(customers.organizationId, organizationId));

  const totalCustomers = allCustomers.length;

  if (!orgProgram) {
    return {
      dailyVisits: Array.from({ length: 30 }).map((_, i) => ({
        date: `day-${i}`,
        dayLabel: `${i + 1}`,
        isToday: i === 29,
        visits: 0,
      })),
      inactiveCustomers: [],
      peakDailyVisits: 0,
      planLimit: PLAN_LIMIT,
      programType,
      recentActivity: [],
      repeatCustomersCount: 0,
      repeatRate: 0,
      topCustomers: [],
      totalCustomers,
      totalNewThisMonth: 0,
      totalRevenueDA: 0,
      totalRewardsRedeemed: 0,
      totalTransactions: 0,
      totalVisits30Days: 0,
    };
  }

  // 4. Fetch all transactions and redemptions in parallel
  const [allTransactions, allRedemptions] = await Promise.all([
    db
      .select({
        amount: transactions.amount,
        cardBalance: cards.balance,
        cardId: transactions.cardId,
        createdAt: transactions.createdAt,
        customerId: cards.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        id: transactions.id,
        type: transactions.type,
      })
      .from(transactions)
      .innerJoin(cards, eq(transactions.cardId, cards.id))
      .innerJoin(customers, eq(cards.customerId, customers.id))
      .where(eq(cards.programId, orgProgram.id))
      .orderBy(desc(transactions.createdAt)),
    db
      .select({
        cardId: redemptions.cardId,
        createdAt: redemptions.createdAt,
        customerId: cards.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        id: redemptions.id,
      })
      .from(redemptions)
      .innerJoin(cards, eq(redemptions.cardId, cards.id))
      .innerJoin(customers, eq(cards.customerId, customers.id))
      .where(eq(cards.programId, orgProgram.id))
      .orderBy(desc(redemptions.createdAt)),
  ]);

  const totalTransactions = allTransactions.length;
  const totalRewardsRedeemed = allRedemptions.length;

  // 5. Calculate 30-day visits & revenue
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const dailyBuckets: Record<string, number> = {};

  for (let i = 0; i < 30; i += 1) {
    const day = new Date(thirtyDaysAgo);
    day.setDate(thirtyDaysAgo.getDate() + i);
    dailyBuckets[formatDayKey(day)] = 0;
  }

  let totalVisits30Days = 0;
  let totalRevenueDA = 0;

  for (const tx of allTransactions) {
    const txDate = tx.createdAt;
    const isWithin30Days = txDate >= thirtyDaysAgo;

    // Revenue calculation
    const txSpendDA =
      programType === "points"
        ? Math.round((tx.amount * 100) / pointsPerSpend)
        : minSpendDA;

    if (isWithin30Days) {
      totalRevenueDA += txSpendDA;
      totalVisits30Days += 1;

      const key = formatDayKey(txDate);
      if (key in dailyBuckets) {
        dailyBuckets[key] = (dailyBuckets[key] ?? 0) + 1;
      }
    }
  }

  const dailyVisits: DailyVisit[] = Object.entries(dailyBuckets).map(
    ([dateStr, visits], idx) => {
      const d = new Date(dateStr);
      return {
        date: dateStr,
        dayLabel: `${d.getDate()}`,
        isToday: idx === 29,
        visits,
      };
    }
  );

  const peakDailyVisits = Math.max(...dailyVisits.map((v) => v.visits), 0);

  // 6. Retention & Repeat Customer Calculations
  const visitsPerCustomer: Record<
    string,
    {
      balance: number;
      lastVisitAt: Date;
      name: string;
      phone: string;
      spendDA: number;
      visits: number;
    }
  > = {};

  for (const tx of allTransactions) {
    const cId = tx.customerId;
    const txSpendDA =
      programType === "points"
        ? Math.round((tx.amount * 100) / pointsPerSpend)
        : minSpendDA;

    if (visitsPerCustomer[cId]) {
      visitsPerCustomer[cId].visits += 1;
      visitsPerCustomer[cId].spendDA += txSpendDA;
      if (tx.createdAt > visitsPerCustomer[cId].lastVisitAt) {
        visitsPerCustomer[cId].lastVisitAt = tx.createdAt;
      }
    } else {
      visitsPerCustomer[cId] = {
        balance: tx.cardBalance,
        lastVisitAt: tx.createdAt,
        name: tx.customerName,
        phone: tx.customerPhone,
        spendDA: txSpendDA,
        visits: 1,
      };
    }
  }

  const repeatCustomersCount = Object.values(visitsPerCustomer).filter(
    (c) => c.visits >= 2
  ).length;

  const repeatRate =
    totalCustomers > 0
      ? Math.round((repeatCustomersCount / totalCustomers) * 100)
      : 0;

  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const totalNewThisMonth = allCustomers.filter(
    (c) => c.createdAt >= firstDayOfMonth
  ).length;

  // 7. Top Customers
  const topCustomers: TopCustomerItem[] = Object.entries(visitsPerCustomer)
    .toSorted(
      (a, b) => b[1].visits - a[1].visits || b[1].spendDA - a[1].spendDA
    )
    .slice(0, 5)
    .map(([id, c]) => ({
      balance: c.balance,
      id,
      name: c.name,
      phone: c.phone,
      spendDA: c.spendDA,
      visits: c.visits,
    }));

  // 8. Inactive Customers (last visit > 20 days ago)
  const twentyDaysAgo = new Date();
  twentyDaysAgo.setDate(now.getDate() - 20);

  const inactiveCustomers: InactiveCustomerItem[] = Object.entries(
    visitsPerCustomer
  )
    .filter(([, c]) => c.lastVisitAt < twentyDaysAgo)
    .toSorted((a, b) => a[1].lastVisitAt.getTime() - b[1].lastVisitAt.getTime())
    .slice(0, 5)
    .map(([id, c]) => {
      const diffMs = now.getTime() - c.lastVisitAt.getTime();
      const daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return {
        daysInactive,
        id,
        lastVisitAt: c.lastVisitAt,
        name: c.name,
        phone: c.phone,
      };
    });

  // 9. Live Recent Activity Feed
  interface FeedCandidate {
    amount: number;
    createdAt: Date;
    customerName: string;
    deltaText: string;
    id: string;
    initials: string;
    spendText: string;
    type: "points" | "redeem" | "stamp";
    typeLabel: string;
  }

  const rawActivityFeed: FeedCandidate[] = [];

  for (const tx of allTransactions) {
    const isPoints = programType === "points";
    const spendDA = isPoints
      ? Math.round((tx.amount * 100) / pointsPerSpend)
      : minSpendDA;

    rawActivityFeed.push({
      amount: tx.amount,
      createdAt: tx.createdAt,
      customerName: tx.customerName,
      deltaText: isPoints ? `+${tx.amount} pts` : `+${tx.amount} tampon`,
      id: tx.id,
      initials: getInitials(tx.customerName),
      spendText: `${spendDA} DA`,
      type: isPoints ? "points" : "stamp",
      typeLabel: isPoints ? "Points gagnés" : "Tampon attribué",
    });
  }

  for (const red of allRedemptions) {
    const isPoints = programType === "points";
    rawActivityFeed.push({
      amount: stampsRequired,
      createdAt: red.createdAt,
      customerName: red.customerName,
      deltaText: isPoints
        ? `-${stampsRequired} pts`
        : `-${stampsRequired} tampons`,
      id: red.id,
      initials: getInitials(red.customerName),
      spendText: "—",
      type: "redeem",
      typeLabel: "Récompense",
    });
  }

  const recentActivity = rawActivityFeed
    .toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 15);

  return {
    dailyVisits,
    inactiveCustomers,
    peakDailyVisits,
    planLimit: PLAN_LIMIT,
    programType,
    recentActivity,
    repeatCustomersCount,
    repeatRate,
    topCustomers,
    totalCustomers,
    totalNewThisMonth,
    totalRevenueDA,
    totalRewardsRedeemed,
    totalTransactions,
    totalVisits30Days,
  };
};
