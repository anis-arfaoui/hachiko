"use server";

import { eq, or } from "drizzle-orm";
import { headers } from "next/headers";

import { findOrCreateCard, getCardByToken } from "@/dal/card";
import { findOrCreateCustomer } from "@/dal/customer";
import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization, upsertProgram } from "@/dal/program";
import { addStampToCard, redeemCardReward } from "@/dal/transaction";
import type { AddStampResult, RedeemRewardResult } from "@/dal/transaction";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { isValidAlgerianPhone } from "@/lib/phone";
import { checkRateLimit } from "@/lib/rate-limit";

export interface JoinProgramInput {
  name: string;
  orgSlugOrId: string;
  phone: string;
}

export type JoinProgramResult =
  | {
      error:
        | "BUSINESS_NOT_FOUND"
        | "INVALID_NAME"
        | "INVALID_PHONE"
        | "PROGRAM_NOT_FOUND"
        | "RATE_LIMITED";
      success: false;
    }
  | {
      orgId: string;
      success: true;
      token: string;
    };

const IP_WINDOW_MS = 10 * 60 * 1000;
const MAX_JOINS_PER_IP = 10;
const MAX_JOINS_PER_PHONE = 5;

export const joinProgramAction = async (
  input: JoinProgramInput
): Promise<JoinProgramResult> => {
  const trimmedName = input.name.trim();

  // Name length validation
  if (trimmedName.length < 2 || trimmedName.length > 60) {
    return { error: "INVALID_NAME", success: false };
  }

  // Phone validation
  if (!isValidAlgerianPhone(input.phone)) {
    return { error: "INVALID_PHONE", success: false };
  }

  // Anti-abuse IP rate limiting
  const reqHeaders = await headers();
  const forwardedFor = reqHeaders.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ||
    reqHeaders.get("x-real-ip") ||
    reqHeaders.get("cf-connecting-ip") ||
    "ip_unknown";

  const ipLimit = checkRateLimit(
    `join_ip:${clientIp}`,
    MAX_JOINS_PER_IP,
    IP_WINDOW_MS
  );

  if (!ipLimit.success) {
    return { error: "RATE_LIMITED", success: false };
  }

  // Anti-abuse phone rate limiting
  const phoneLimit = checkRateLimit(
    `join_phone:${input.phone}`,
    MAX_JOINS_PER_PHONE,
    IP_WINDOW_MS
  );

  if (!phoneLimit.success) {
    return { error: "RATE_LIMITED", success: false };
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
    name: trimmedName,
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
