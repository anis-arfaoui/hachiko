import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Log Messages from Devices
 * POST /v1/log
 */
export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    if (body.logs && Array.isArray(body.logs)) {
      for (const log of body.logs) {
        console.warn(`[AppleWalletDeviceLog] ${log}`);
      }
    }
  } catch {
    // Silently acknowledge even on malformed body per Apple spec
  }

  return new NextResponse(null, { status: 200 });
};
