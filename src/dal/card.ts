import { and, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { cards, customers, programs, transactions } from "@/db/schema/loyalty";
import { normalizeAlgerianPhone } from "@/lib/phone";

import { generateCustomerCode } from "./customer";

export const generateSecureCardToken = (): string =>
  `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;

export const findOrCreateCard = async (
  customerId: string,
  programId: string
) => {
  const existing = await db
    .select()
    .from(cards)
    .where(
      and(eq(cards.customerId, customerId), eq(cards.programId, programId))
    )
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const token = generateSecureCardToken();

  const inserted = await db
    .insert(cards)
    .values({
      balance: 0,
      customerId,
      id: crypto.randomUUID(),
      programId,
      token,
    })
    .returning();

  return inserted[0];
};

export const getCardByToken = async (token: string) => {
  const result = await db
    .select({
      balance: cards.balance,
      brandColor: programs.brandColor,
      businessId: organization.id,
      businessLogo: organization.logo,
      businessName: organization.name,
      cardCreatedAt: cards.createdAt,
      cardId: cards.id,
      customerCode: customers.code,
      customerId: customers.id,
      customerName: customers.name,
      customerPhone: customers.phone,
      logoUrl: programs.logoUrl,
      programId: programs.id,
      programType: programs.type,
      rewardLabel: programs.rewardLabel,
      stampsRequired: programs.stampsRequired,
      token: cards.token,
    })
    .from(cards)
    .innerJoin(customers, eq(cards.customerId, customers.id))
    .innerJoin(programs, eq(cards.programId, programs.id))
    .innerJoin(organization, eq(programs.organizationId, organization.id))
    .where(eq(cards.token, token))
    .limit(1);

  const [card] = result;
  if (!card) {
    return null;
  }

  if (!card.customerCode) {
    const newCode = await generateCustomerCode(card.businessId);
    await db
      .update(customers)
      .set({ code: newCode })
      .where(eq(customers.id, card.customerId));
    card.customerCode = newCode;
  }

  return card;
};

export interface CardDetailsWithCooldown {
  balance: number;
  brandColor: string;
  businessId: string;
  businessLogo: string | null;
  businessName: string;
  cardCreatedAt: Date;
  cardId: string;
  cooldownRemainingSeconds: number;
  customerCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  isCooldownActive: boolean;
  logoUrl: string | null;
  programId: string;
  programType: string;
  rewardLabel: string;
  stampsRequired: number;
  token: string;
}

export const findCardByIdentifier = async (
  organizationId: string,
  rawIdentifier: string
): Promise<CardDetailsWithCooldown | null> => {
  let cleaned = rawIdentifier.trim();
  if (!cleaned) {
    return null;
  }

  // Handle scanned URLs: extract token from /c/<token>
  if (cleaned.includes("/c/")) {
    const parts = cleaned.split("/c/");
    cleaned = parts.at(-1)?.split("?")[0] || cleaned;
  }

  // Normalize potential customer code: e.g. "9SYKSZ" -> "C-9SYKSZ"
  const upper = cleaned.toUpperCase().replaceAll(/\s+/gu, "");
  let codeCandidate = upper;
  if (!upper.startsWith("C-") && /^[A-Z0-9]{6}$/u.test(upper)) {
    codeCandidate = `C-${upper}`;
  }

  // Normalize potential Algerian phone number
  const phoneCandidate = normalizeAlgerianPhone(cleaned);

  // Search card belonging to this organization by token, code, or phone
  const rows = await db
    .select({
      balance: cards.balance,
      brandColor: programs.brandColor,
      businessId: organization.id,
      businessLogo: organization.logo,
      businessName: organization.name,
      cardCreatedAt: cards.createdAt,
      cardId: cards.id,
      customerCode: customers.code,
      customerId: customers.id,
      customerName: customers.name,
      customerPhone: customers.phone,
      logoUrl: programs.logoUrl,
      programId: programs.id,
      programType: programs.type,
      rewardLabel: programs.rewardLabel,
      stampsRequired: programs.stampsRequired,
      token: cards.token,
    })
    .from(cards)
    .innerJoin(customers, eq(cards.customerId, customers.id))
    .innerJoin(programs, eq(cards.programId, programs.id))
    .innerJoin(organization, eq(programs.organizationId, organization.id))
    .where(
      and(
        eq(organization.id, organizationId),
        or(
          eq(cards.token, cleaned),
          eq(customers.code, codeCandidate),
          eq(customers.phone, phoneCandidate),
          eq(customers.phone, cleaned)
        )
      )
    )
    .limit(1);

  const [card] = rows;
  if (!card) {
    return null;
  }

  // Backfill customer code if null
  if (!card.customerCode) {
    const newCode = await generateCustomerCode(organizationId);
    await db
      .update(customers)
      .set({ code: newCode })
      .where(eq(customers.id, card.customerId));
    card.customerCode = newCode;
  }

  // Check 3-minute cooldown against recent transactions
  const COOLDOWN_MINUTES = 3;
  const recentTransactions = await db
    .select({ createdAt: transactions.createdAt })
    .from(transactions)
    .where(
      and(
        eq(transactions.cardId, card.cardId),
        or(eq(transactions.type, "stamp"), eq(transactions.type, "points"))
      )
    )
    .orderBy(desc(transactions.createdAt))
    .limit(1);

  let isCooldownActive = false;
  let cooldownRemainingSeconds = 0;

  if (recentTransactions[0]) {
    const elapsedMs = Date.now() - recentTransactions[0].createdAt.getTime();
    const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
    if (elapsedMs < cooldownMs) {
      isCooldownActive = true;
      cooldownRemainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
    }
  }

  return {
    ...card,
    cooldownRemainingSeconds,
    customerCode: card.customerCode,
    isCooldownActive,
  };
};
