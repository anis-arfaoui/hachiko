import { getLoyaltyClassId } from "./class";
import { getGoogleWalletClient } from "./client";

export interface BroadcastGoogleWalletParams {
  actionUrl?: string | null;
  body: string;
  header: string;
  programId: string;
}

/**
 * Broadcasts a push notification to all Google Wallet pass holders of a loyalty program.
 * Triggers a native Android wake-up notification and adds the message to the pass.
 */
export const broadcastGoogleWalletNotification = async (
  params: BroadcastGoogleWalletParams
): Promise<boolean> => {
  try {
    const client = getGoogleWalletClient();
    const classId = getLoyaltyClassId(params.programId);

    const bodyText = params.actionUrl
      ? `${params.body} ${params.actionUrl}`
      : params.body;

    await client.loyaltyclass.addmessage({
      requestBody: {
        message: {
          body: bodyText,
          displayInterval: {
            end: { date: new Date(Date.now() + 7 * 86_400_000).toISOString() },
            start: { date: new Date().toISOString() },
          },
          header: params.header,
          id: `broadcast_${Date.now()}`,
          messageType: "TEXT_AND_NOTIFY",
        },
      },
      resourceId: classId,
    });
    return true;
  } catch (error) {
    console.warn(
      `[GoogleWalletBroadcast] Error sending broadcast for program ${params.programId}:`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
};
