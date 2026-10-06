"use server";

import { eq, or } from "drizzle-orm";

import { findOrCreateCard, getCardByToken } from "@/dal/card";
import { findOrCreateCustomer } from "@/dal/customer";
import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization, upsertProgram } from "@/dal/program";
import { addStampToCard, redeemCardReward } from "@/dal/transaction";
import type { AddStampResult, RedeemRewardResult } from "@/dal/transaction";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { isValidAlgerianPhone } from "@/lib/phone";

export interface JoinProgramInput {
  name: string;
  orgSlugOrId: string;
  phone: string;
}

export type JoinProgramResult =
  | {
      error: "BUSINESS_NOT_FOUND" | "INVALID_PHONE" | "PROGRAM_NOT_FOUND";
      success: false;
    }
  | {
      orgId: string;
      success: true;
      token: string;
    };

export const joinProgramAction = async (
  input: JoinProgramInput
): Promise<JoinProgramResult> => {
  if (!isValidAlgerianPhone(input.phone)) {
    return { error: "INVALID_PHONE", success: false };
  }

  // Look up business by slug or ID
  const orgResult = await db
    .select()
    .from(organization)
    .where(
      or(
        eq(organization.slug, input.orgSlugOrId),
        eq(organization.id, input.orgSlugOrId)
      )
    )
    .limit(1);

  const [business] = orgResult;

  if (!business) {
    return { error: "BUSINESS_NOT_FOUND", success: false };
  }

  // Look up or initialize loyalty program
  let program = await getProgramByOrganization(business.id);

  if (!program) {
    program = await upsertProgram(business.id, {
      brandColor: "#18181b",
      rewardLabel: "1 Récompense offerte",
      stampsRequired: 10,
    });
  }

  if (!program) {
    return { error: "PROGRAM_NOT_FOUND", success: false };
  }

  // Find or create customer for this business
  const customer = await findOrCreateCustomer(business.id, {
    name: input.name,
    phone: input.phone,
  });

  // Find or create customer loyalty card with unique secret token
  const card = await findOrCreateCard(customer.id, program.id);

  return {
    orgId: business.id,
    success: true,
    token: card.token,
  };
};

export const getCardDetailsAction = async (token: string) => {
  const card = await getCardByToken(token);
  return card;
};

export interface ScanStampInput {
  clientUuid: string;
  token: string;
}

export type ScanStampActionResult =
  | AddStampResult
  | {
      error: "UNAUTHORIZED";
      success: false;
    };

export const scanStampAction = async (
  input: ScanStampInput
): Promise<ScanStampActionResult> => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    return { error: "UNAUTHORIZED", success: false };
  }

  return addStampToCard({
    clientUuid: input.clientUuid,
    organizationId: merchantSession.organizationId,
    staffUserId: merchantSession.userId,
    token: input.token,
  });
};

export type ScanRedeemActionResult =
  | RedeemRewardResult
  | {
      error: "UNAUTHORIZED";
      success: false;
    };

export const scanRedeemAction = async (
  token: string
): Promise<ScanRedeemActionResult> => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    return { error: "UNAUTHORIZED", success: false };
  }

  return redeemCardReward({
    organizationId: merchantSession.organizationId,
    staffUserId: merchantSession.userId,
    token,
  });
};
