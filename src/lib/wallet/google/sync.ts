import { getGoogleWalletClient } from "./client";
import { getLoyaltyObjectId } from "./object";

export interface SyncGoogleWalletParams {
  balance: number;
  businessName?: string;
  cardId: string;
  notificationMessage?: {
    body: string;
    header: string;
  };
  programType?: string;
  rewardLabel?: string;
  stampsRequired?: number;
}

/**
 * Synchronizes card balance with Google Wallet and optionally delivers
 * a native Android push notification via TEXT_AND_NOTIFY.
 * Safe and non-blocking: never throws, so checkout never fails.
 */
export const syncGoogleWalletCard = async (
  params: SyncGoogleWalletParams
): Promise<void> => {
  try {
    const client = getGoogleWalletClient();
    const objectId = getLoyaltyObjectId(params.cardId);

    const isPoints = params.programType === "points";
    const pointsLabel = isPoints ? "Points" : "Tampons";
    const stampsReq = params.stampsRequired || 10;
    const balanceString = isPoints
      ? `${params.balance} / ${stampsReq} pts`
      : `${params.balance} / ${stampsReq}`;

    // 1. Update card balance on Google servers
    await client.loyaltyobject.patch({
      requestBody: {
        loyaltyPoints: {
          balance: {
            string: balanceString,
          },
          label: pointsLabel,
        },
      },
      resourceId: objectId,
    });

    // 2. Deliver native notification if specified (wrapped so notification quota limits don't block sync)
    if (params.notificationMessage) {
      try {
        await client.loyaltyobject.addmessage({
          requestBody: {
            message: {
              body: params.notificationMessage.body,
              header: params.notificationMessage.header,
              messageType: "TEXT_AND_NOTIFY",
            },
          },
          resourceId: objectId,
        });
      } catch (msgError: unknown) {
        console.warn(
          `[GoogleWalletSync] Message delivery note for pass ${params.cardId}:`,
          msgError instanceof Error ? msgError.message : msgError
        );
      }
    }
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    // 404 means the customer hasn't added the card to Google Wallet yet, which is normal
    if (status !== 404) {
      console.warn(
        `[GoogleWalletSync] Failed to sync pass ${params.cardId} (status ${status}):`,
        error instanceof Error ? error.message : error
      );
    }
  }
};
