import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { appleWalletRegistrations, cards } from "@/db/schema/loyalty";

interface RouteParams {
  params: Promise<{
    deviceLibraryIdentifier: string;
    passTypeIdentifier: string;
  }>;
}

/**
 * Get Serial Numbers for Passes Associated with a Device
 * GET /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}?passesUpdatedSince={tag}
 */
export const GET = async (req: NextRequest, { params }: RouteParams) => {
  const { deviceLibraryIdentifier, passTypeIdentifier } = await params;
  const url = new URL(req.url);
  const passesUpdatedSince = url.searchParams.get("passesUpdatedSince");

  let updatedSinceDate: Date | null = null;
  if (passesUpdatedSince) {
    const parsed = new Date(passesUpdatedSince);
    if (!Number.isNaN(parsed.getTime())) {
      updatedSinceDate = parsed;
    }
  }

  const query = db
    .select({
      cardUpdatedAt: cards.updatedAt,
      serialNumber: appleWalletRegistrations.serialNumber,
    })
    .from(appleWalletRegistrations)
    .innerJoin(cards, eq(appleWalletRegistrations.serialNumber, cards.id))
    .where(
      and(
        eq(
          appleWalletRegistrations.deviceLibraryIdentifier,
          deviceLibraryIdentifier
        ),
        eq(appleWalletRegistrations.passTypeIdentifier, passTypeIdentifier),
        updatedSinceDate ? gt(cards.updatedAt, updatedSinceDate) : undefined
      )
    );

  const results = await query;

  if (results.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  // Find latest updatedAt timestamp across all matching passes
  let maxDate = results[0]?.cardUpdatedAt ?? new Date();
  for (const row of results) {
    if (row.cardUpdatedAt > maxDate) {
      maxDate = row.cardUpdatedAt;
    }
  }

  return NextResponse.json({
    lastUpdated: maxDate.toISOString(),
    serialNumbers: results.map((r) => r.serialNumber),
  });
};
