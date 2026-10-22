"use server";

import { getCardByToken } from "@/dal/card";
import { isAppleWalletConfigured } from "@/lib/wallet/apple";
import { generateGoogleWalletSaveUrl } from "@/lib/wallet/google";

export interface WalletSaveUrlResult {
  error?: string;
  saveUrl?: string;
  success: boolean;
}

export interface AppleWalletUrlResult {
  configured: boolean;
  error?: string;
  passUrl?: string;
  success: boolean;
}

export const getAppleWalletPassUrlAction = async (
  token: string
): Promise<AppleWalletUrlResult> => {
  if (!token) {
    return { configured: false, error: "INVALID_TOKEN", success: false };
  }

  if (!isAppleWalletConfigured()) {
    return {
      configured: false,
      error:
        "Le pass Apple Wallet sera activé très prochainement pour ce commerce. Utilisez votre QR code en caisse !",
      success: false,
    };
  }

  const card = await getCardByToken(token);
  if (!card) {
    return { configured: true, error: "CARD_NOT_FOUND", success: false };
  }

  return {
    configured: true,
    passUrl: `/api/wallet/apple/pass/${token}`,
    success: true,
  };
};

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
