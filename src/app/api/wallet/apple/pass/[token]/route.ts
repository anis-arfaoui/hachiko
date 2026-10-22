import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCardByToken } from "@/dal/card";
import {
  AppleWalletNotConfiguredError,
  generateApplePassBuffer,
} from "@/lib/wallet/apple/pass";

interface RouteParams {
  params: Promise<{
    token: string;
  }>;
}

/**
 * Direct download endpoint for customers adding their pass to Apple Wallet
 * GET /api/wallet/apple/pass/[token]
 */
export const GET = async (_req: NextRequest, { params }: RouteParams) => {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const card = await getCardByToken(token);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  try {
    const passBuffer = await generateApplePassBuffer({
      balance: card.balance,
      brandColor: card.brandColor,
      businessName: card.businessName,
      cardId: card.cardId,
      customerCode: card.customerCode,
      customerName: card.customerName,
      customerPhone: card.customerPhone,
      logoUrl: card.logoUrl || card.businessLogo,
      programType: card.programType,
      rewardLabel: card.rewardLabel,
      stampsRequired: card.stampsRequired,
      token: card.token,
    });

    const filename = `${card.businessName.replaceAll(/\s+/gu, "_")}_pass.pkpass`;

    return new NextResponse(new Uint8Array(passBuffer), {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/vnd.apple.pkpass",
      },
      status: 200,
    });
  } catch (error) {
    if (error instanceof AppleWalletNotConfiguredError) {
      return NextResponse.json(
        {
          configured: false,
          error: error.message,
          message:
            "Le pass Apple Wallet n'est pas encore configuré avec les certificats officiels Apple.",
        },
        { status: 503 }
      );
    }

    console.error("[AppleWalletDownload] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate Apple Wallet pass" },
      { status: 500 }
    );
  }
};
