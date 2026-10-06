import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { cards, customers, programs } from "@/db/schema/loyalty";

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
      customerId: customers.id,
      customerName: customers.name,
      customerPhone: customers.phone,
      logoUrl: programs.logoUrl,
      programId: programs.id,
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

  return result[0] ?? null;
};
