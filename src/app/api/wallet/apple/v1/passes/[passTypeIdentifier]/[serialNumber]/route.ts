import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyApplePassAuth } from "@/lib/wallet/apple/auth";
import {
  AppleWalletNotConfiguredError,
  generateApplePassBuffer,
} from "@/lib/wallet/apple/pass";

interface RouteParams {
  params: Promise<{
    passTypeIdentifier: string;
    serialNumber: string;
  }>;
}

/**
 * Deliver the Latest Version of a Pass
 * GET /v1/passes/{passTypeIdentifier}/{serialNumber}
 */
export const GET = async (req: NextRequest, { params }: RouteParams) => {
  const { serialNumber } = await params;

  // 1. Verify authorization
  const card = await verifyApplePassAuth(req, serialNumber);
  if (!card) {
    return new NextResponse(null, { status: 401 });
  }

  // 2. Check If-Modified-Since
  const ifModifiedSince = req.headers.get("if-modified-since");
  if (ifModifiedSince) {
    const ifModifiedDate = new Date(ifModifiedSince);
    if (
      !Number.isNaN(ifModifiedDate.getTime()) &&
      card.cardUpdatedAt.getTime() <= ifModifiedDate.getTime()
    ) {
      return new NextResponse(null, { status: 304 });
    }
  }

  // 3. Generate updated pass
  try {
    const passBuffer = await generateApplePassBuffer({
      balance: card.balance,
      brandColor: card.brandColor,
      businessName: card.businessName,
      cardId: card.cardId,
      customerCode: card.customerCode,
      customerName: card.customerName,
      customerPhone: card.customerPhone,
      logoUrl: card.logoUrl,
      programType: card.programType,
      rewardLabel: card.rewardLabel,
      stampsRequired: card.stampsRequired,
      token: card.token,
    });

    return new NextResponse(new Uint8Array(passBuffer), {
      headers: {
        "Content-Disposition": `attachment; filename="pass.pkpass"`,
        "Content-Type": "application/vnd.apple.pkpass",
        "Last-Modified": card.cardUpdatedAt.toUTCString(),
      },
      status: 200,
    });
  } catch (error) {
    if (error instanceof AppleWalletNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error(
      `[AppleWalletPass] Error generating pass ${serialNumber}:`,
      error
    );
    return new NextResponse(null, { status: 500 });
  }
};
