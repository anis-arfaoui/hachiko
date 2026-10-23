import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { cards, customers, programs } from "@/db/schema/loyalty";

export const verifyApplePassAuth = async (
  req: NextRequest,
  serialNumber: string
) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "applepass") {
    return null;
  }

  const [, providedToken] = parts;

  const rows = await db
    .select({
      balance: cards.balance,
      brandColor: programs.brandColor,
      businessName: organization.name,
      cardCreatedAt: cards.createdAt,
      cardId: cards.id,
      cardUpdatedAt: cards.updatedAt,
      customerCode: customers.code,
      customerName: customers.name,
      customerPhone: customers.phone,
      logoUrl: programs.logoUrl,
      organizationId: organization.id,
      programType: programs.type,
      rewardLabel: programs.rewardLabel,
      stampsRequired: programs.stampsRequired,
      token: cards.token,
    })
    .from(cards)
    .innerJoin(customers, eq(cards.customerId, customers.id))
    .innerJoin(programs, eq(cards.programId, programs.id))
    .innerJoin(organization, eq(programs.organizationId, organization.id))
    .where(eq(cards.id, serialNumber))
    .limit(1);

  const [card] = rows;
  if (!card || card.token !== providedToken) {
    return null;
  }

  return card;
};
