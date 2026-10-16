import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import { cashiers, customers, transactions } from "@/db/schema/loyalty";

export interface CashierItem {
  code: string;
  codeExpiresAt: Date | null;
  createdAt: Date;
  id: string;
  lastActiveAt: Date | null;
  name: string;
  organizationId: string;
  token: string;
}

export interface CashierLeaderboardStats {
  avis: number;
  ca: number;
  cartes: number;
  cashierId: string;
  code: string;
  createdAt: Date;
  lastActiveAt: Date | null;
  name: string;
  points: number;
  rank: number;
  scans: number;
  token: string;
}

const generateRandom6DigitCode = (): string =>
  String(Math.floor(100_000 + Math.random() * 900_000));

export const generateUniqueCashierCode = async (): Promise<string> => {
  const candidates: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    candidates.push(generateRandom6DigitCode());
  }

  const existing = await db
    .select({ code: cashiers.code })
    .from(cashiers)
    .where(inArray(cashiers.code, candidates));

  const existingCodes = new Set(existing.map((r) => r.code));
  for (const candidate of candidates) {
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }

  return generateRandom6DigitCode();
};

export const getCashiersByOrganization = async (
  organizationId: string
): Promise<CashierItem[]> => {
  const rows = await db
    .select()
    .from(cashiers)
    .where(eq(cashiers.organizationId, organizationId))
    .orderBy(desc(cashiers.createdAt));

  return rows;
};

export const getCashierByCode = async (
  code: string
): Promise<CashierItem | null> => {
  const normalizedCode = code.trim().replaceAll(/\s+/gu, "");
  if (!normalizedCode) {
    return null;
  }

  const [row] = await db
    .select()
    .from(cashiers)
    .where(eq(cashiers.code, normalizedCode))
    .limit(1);

  return row || null;
};

export const getCashierByToken = async (
  token: string
): Promise<CashierItem | null> => {
  const trimmed = token.trim();
  if (!trimmed) {
    return null;
  }

  const [row] = await db
    .select()
    .from(cashiers)
    .where(eq(cashiers.token, trimmed))
    .limit(1);

  return row || null;
};

export const createCashier = async (
  organizationId: string,
  name: string
): Promise<CashierItem> => {
  const trimmedName = name.trim();
  const code = await generateUniqueCashierCode();
  const token = crypto.randomUUID();
  const id = `csh_${crypto.randomUUID().slice(0, 12)}`;

  const [row] = await db
    .insert(cashiers)
    .values({
      code,
      id,
      name: trimmedName,
      organizationId,
      token,
    })
    .returning();

  return row;
};

export const deleteCashier = async (
  organizationId: string,
  cashierId: string
): Promise<boolean> => {
  const res = await db
    .delete(cashiers)
    .where(
      and(
        eq(cashiers.id, cashierId),
        eq(cashiers.organizationId, organizationId)
      )
    )
    .returning();

  return res.length > 0;
};

export const regenerateCashierCode = async (
  organizationId: string,
  cashierId: string
): Promise<CashierItem | null> => {
  const newCode = await generateUniqueCashierCode();
  const newToken = crypto.randomUUID();

  const [updated] = await db
    .update(cashiers)
    .set({
      code: newCode,
      token: newToken,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(cashiers.id, cashierId),
        eq(cashiers.organizationId, organizationId)
      )
    )
    .returning();

  return updated || null;
};

export const getCashiersLeaderboard = async (
  organizationId: string,
  period: "7d" | "30d" | "all" | string = "30d"
): Promise<{ cashiers: CashierItem[]; stats: CashierLeaderboardStats[] }> => {
  const cashierList = await getCashiersByOrganization(organizationId);

  if (cashierList.length === 0) {
    return { cashiers: [], stats: [] };
  }

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (period === "7d") {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "30d") {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  } else if (period !== "all") {
    // Specific day format YYYY-MM-DD
    const parsed = new Date(period);
    if (!Number.isNaN(parsed.getTime())) {
      startDate = new Date(parsed.setHours(0, 0, 0, 0));
      endDate = new Date(parsed.setHours(23, 59, 59, 999));
    }
  }

  // Fetch transactions with cashierId
  const txConditions = [eq(transactions.cardId, transactions.cardId)];
  if (startDate) {
    txConditions.push(gte(transactions.createdAt, startDate));
  }
  if (endDate) {
    txConditions.push(lte(transactions.createdAt, endDate));
  }

  const txRows = await db
    .select({
      amount: transactions.amount,
      cashierId: transactions.cashierId,
      spendAmount: transactions.spendAmount,
      type: transactions.type,
    })
    .from(transactions)
    .where(and(...txConditions));

  // Fetch customers with cashierId
  const custConditions = [eq(customers.organizationId, organizationId)];
  if (startDate) {
    custConditions.push(gte(customers.createdAt, startDate));
  }
  if (endDate) {
    custConditions.push(lte(customers.createdAt, endDate));
  }

  const custRows = await db
    .select({
      cashierId: customers.cashierId,
      id: customers.id,
    })
    .from(customers)
    .where(and(...custConditions));

  // Aggregate stats per cashier
  const statsList: CashierLeaderboardStats[] = [];

  for (const c of cashierList) {
    let cartesCount = 0;
    for (const cust of custRows) {
      if (cust.cashierId === c.id) {
        cartesCount += 1;
      }
    }

    let scansCount = 0;
    let pointsTotal = 0;
    let caTotal = 0;
    const avisCount = 0;

    for (const tx of txRows) {
      if (tx.cashierId === c.id) {
        scansCount += 1;
        if (tx.type !== "reset") {
          pointsTotal += tx.amount;
        }
        if (tx.spendAmount) {
          caTotal += tx.spendAmount;
        }
      }
    }

    statsList.push({
      avis: avisCount,
      ca: caTotal,
      cartes: cartesCount,
      cashierId: c.id,
      code: c.code,
      createdAt: c.createdAt,
      lastActiveAt: c.lastActiveAt,
      name: c.name,
      points: pointsTotal,
      rank: 1,
      scans: scansCount,
      token: c.token,
    });
  }

  // Sort by scans descending, then cartes descending, then name
  const sorted = statsList.toSorted((a, b) => {
    if (b.scans !== a.scans) {
      return b.scans - a.scans;
    }
    if (b.cartes !== a.cartes) {
      return b.cartes - a.cartes;
    }
    return a.name.localeCompare(b.name);
  });

  // Assign ranks
  const ranked = sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  return {
    cashiers: cashierList,
    stats: ranked,
  };
};
