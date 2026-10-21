import type { walletobjects_v1 } from "googleapis";

import { getLoyaltyClassId } from "./class";
import { getGoogleWalletClient } from "./client";
import { getGoogleWalletConfig } from "./config";

export interface CardObjectData {
  balance: number;
  cardId: string;
  customerCode?: string | null;
  customerName: string;
  programId: string;
  programType?: string;
  rewardLabel?: string;
  stampsRequired: number;
  token: string;
}

export const getLoyaltyObjectId = (cardId: string): string => {
  const { issuerId } = getGoogleWalletConfig();
  return `${issuerId}.card_${cardId.replaceAll(/[^a-zA-Z0-9_-]/gu, "_")}`;
};

export const buildLoyaltyObjectPayload = (
  card: CardObjectData
): walletobjects_v1.Schema$LoyaltyObject => {
  const objectId = getLoyaltyObjectId(card.cardId);
  const classId = getLoyaltyClassId(card.programId);

  const isPoints = card.programType === "points";
  const pointsLabel = isPoints ? "Points" : "Tampons";
  const balanceString = isPoints
    ? `${card.balance} / ${card.stampsRequired} pts`
    : `${card.balance} / ${card.stampsRequired}`;

  const textModules: walletobjects_v1.Schema$TextModuleData[] = [];

  if (card.rewardLabel) {
    textModules.push({
      body: card.rewardLabel,
      header: "PROCHAINE RÉCOMPENSE",
      id: "reward_info",
    });
  }

  return {
    accountId: card.customerCode || card.cardId,
    accountName: card.customerName,
    barcode: {
      alternateText: card.customerCode || "CARTE DE FIDÉLITÉ",
      type: "QR_CODE",
      value: card.token,
    },
    classId,
    id: objectId,
    loyaltyPoints: {
      balance: {
        string: balanceString,
      },
      label: pointsLabel,
    },
    state: "ACTIVE",
    textModulesData: textModules,
  };
};

export const ensureLoyaltyObject = async (
  card: CardObjectData
): Promise<walletobjects_v1.Schema$LoyaltyObject> => {
  const client = getGoogleWalletClient();
  const objectId = getLoyaltyObjectId(card.cardId);
  const objectPayload = buildLoyaltyObjectPayload(card);

  try {
    const existing = await client.loyaltyobject.get({ resourceId: objectId });
    if (existing.data) {
      const updated = await client.loyaltyobject.patch({
        requestBody: objectPayload,
        resourceId: objectId,
      });
      return updated.data;
    }
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    if (status !== 404) {
      console.warn(
        `[GoogleWallet] loyaltyobject.get status ${status}:`,
        (error as Error).message
      );
    }
  }

  const inserted = await client.loyaltyobject.insert({
    requestBody: objectPayload,
  });

  return inserted.data;
};
