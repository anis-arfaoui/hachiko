import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { appleWalletRegistrations } from "@/db/schema/loyalty";
import { verifyApplePassAuth } from "@/lib/wallet/apple/auth";

interface RouteParams {
  params: Promise<{
    deviceLibraryIdentifier: string;
    passTypeIdentifier: string;
    serialNumber: string;
  }>;
}

/**
 * Register a Device to Receive Push Notifications for a Pass
 * POST /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 */
export const POST = async (req: NextRequest, { params }: RouteParams) => {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } =
    await params;

  // 1. Authenticate pass request
  const card = await verifyApplePassAuth(req, serialNumber);
  if (!card) {
    return new NextResponse(null, { status: 401 });
  }

  // 2. Parse pushToken from body
  let pushToken = "";
  try {
    const body = (await req.json()) as { pushToken?: string };
    pushToken = body?.pushToken ?? "";
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (!pushToken) {
    return new NextResponse(null, { status: 400 });
  }

  // 3. Check if already registered
  const existing = await db
    .select({ id: appleWalletRegistrations.id })
    .from(appleWalletRegistrations)
    .where(
      and(
        eq(
          appleWalletRegistrations.deviceLibraryIdentifier,
          deviceLibraryIdentifier
        ),
        eq(appleWalletRegistrations.passTypeIdentifier, passTypeIdentifier),
        eq(appleWalletRegistrations.serialNumber, serialNumber)
      )
    )
    .limit(1);

  if (existing[0]) {
    // Already registered, update push token if changed
    await db
      .update(appleWalletRegistrations)
      .set({ pushToken, updatedAt: new Date() })
      .where(eq(appleWalletRegistrations.id, existing[0].id));
    return new NextResponse(null, { status: 200 });
  }

  // Insert new registration
  await db.insert(appleWalletRegistrations).values({
    deviceLibraryIdentifier,
    id: crypto.randomUUID(),
    passTypeIdentifier,
    pushToken,
    serialNumber,
  });

  return new NextResponse(null, { status: 201 });
};

/**
 * Unregister a Device for a Pass
 * DELETE /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 */
export const DELETE = async (req: NextRequest, { params }: RouteParams) => {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } =
    await params;

  // 1. Authenticate pass request
  const card = await verifyApplePassAuth(req, serialNumber);
  if (!card) {
    return new NextResponse(null, { status: 401 });
  }

  // 2. Delete registration
  await db
    .delete(appleWalletRegistrations)
    .where(
      and(
        eq(
          appleWalletRegistrations.deviceLibraryIdentifier,
          deviceLibraryIdentifier
        ),
        eq(appleWalletRegistrations.passTypeIdentifier, passTypeIdentifier),
        eq(appleWalletRegistrations.serialNumber, serialNumber)
      )
    );

  return new NextResponse(null, { status: 200 });
};
