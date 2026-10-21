"use server";

import { getCardByToken } from "@/dal/card";
import { generateGoogleWalletSaveUrl } from "@/lib/wallet/google";

export interface WalletSaveUrlResult {
  error?: string;
  saveUrl?: string;
  success: boolean;
}

export const getGoogleWalletSaveUrlAction = async (
  token: string
): Promise<WalletSaveUrlResult> => {
  if (!token) {
    return { error: "INVALID_TOKEN", success: false };
  }

  try {
    const card = await getCardByToken(token);

    if (!card) {
      return { error: "CARD_NOT_FOUND", success: false };
    }

    const saveUrl = await generateGoogleWalletSaveUrl({
      card: {
        balance: card.balance,
        cardId: card.cardId,
        customerCode: card.customerCode,
        customerName: card.customerName,
        programId: card.programId,
        programType: card.programType,
        rewardLabel: card.rewardLabel,
        stampsRequired: card.stampsRequired,
        token: card.token,
      },
      program: {
        brandColor: card.brandColor,
        businessName: card.businessName,
        logoUrl: card.logoUrl || card.businessLogo,
        programId: card.programId,
      },
    });

    return {
      saveUrl,
      success: true,
    };
  } catch (error) {
    console.error("[getGoogleWalletSaveUrlAction] Error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate Google Wallet link",
      success: false,
    };
  }
};
