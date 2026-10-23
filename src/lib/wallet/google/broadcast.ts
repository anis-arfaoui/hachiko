import { getLoyaltyClassId } from "./class";
import { getGoogleWalletClient } from "./client";
import { getLoyaltyObjectId } from "./object";

export interface BroadcastGoogleWalletParams {
  actionUrl?: string | null;
  body: string;
  cardIds?: string[];
  header: string;
  programId: string;
}

/**
 * Broadcasts a push notification to all Google Wallet pass holders of a loyalty program.
 * Delivers to both the LoyaltyClass template and directly to individual active LoyaltyObjects
 * to trigger immediate system-level lock screen notifications.
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

    const messagePayload = {
      body: bodyText,
      displayInterval: {
        end: { date: new Date(Date.now() + 7 * 86_400_000).toISOString() },
        start: { date: new Date().toISOString() },
      },
      header: params.header,
      id: `broadcast_${Date.now()}`,
      messageType: "TEXT_AND_NOTIFY",
    };

    // 1. Broadcast to LoyaltyClass (template level)
    const classPromise = client.loyaltyclass.addmessage({
      requestBody: { message: messagePayload },
      resourceId: classId,
    });

    // 2. Also dispatch directly to each individual LoyaltyObject (for direct device pop-up alerts)
    const objectPromises = (params.cardIds ?? []).map(async (cardId) => {
      try {
        const objectId = getLoyaltyObjectId(cardId);
        await client.loyaltyobject.addmessage({
          requestBody: { message: messagePayload },
          resourceId: objectId,
        });
      } catch (objError) {
        // 404 is normal if the pass hasn't been added to Google Wallet by this client yet
        const status = (objError as { status?: number })?.status;
        if (status !== 404) {
          console.warn(
            `[GoogleWalletBroadcast] Object message note for card ${cardId}:`,
            objError instanceof Error ? objError.message : objError
          );
        }
      }
    });

    await Promise.allSettled([classPromise, ...objectPromises]);
    return true;
  } catch (error) {
    console.warn(
      `[GoogleWalletBroadcast] Error sending broadcast for program ${params.programId}:`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
};
