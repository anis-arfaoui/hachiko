import { Template } from "@walletpass/pass-js";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appleWalletRegistrations, cards } from "@/db/schema/loyalty";

import { getAppleWalletConfig, isAppleWalletConfigured } from "./config";

export interface SyncAppleWalletParams {
  cardId: string;
}

let pushTemplateInstance: Template | null = null;

const getPushTemplate = (): Template => {
  if (pushTemplateInstance) {
    return pushTemplateInstance;
  }

  const config = getAppleWalletConfig();
  const template = new Template("storeCard", {
    passTypeIdentifier: config.passTypeIdentifier,
    teamIdentifier: config.teamIdentifier,
  });

  template.setCertificate(config.passCertPem);
  template.setPrivateKey(config.passKeyPem, config.passKeyPassphrase);

  pushTemplateInstance = template;
  return template;
};

/**
 * Sends a silent background APNs push notification to all iOS devices
 * that have added this card to Apple Wallet.
 *
 * Safe and non-blocking: catches all errors so checkout/transactions never fail.
 */
export const syncAppleWalletCard = async (
  params: SyncAppleWalletParams
): Promise<void> => {
  try {
    if (!isAppleWalletConfigured()) {
      // In development / before certificates are uploaded, cleanly skip
      return;
    }

    // 1. Find all registered devices for this card
    const registrations = await db
      .select({
        deviceLibraryIdentifier:
          appleWalletRegistrations.deviceLibraryIdentifier,
        id: appleWalletRegistrations.id,
        pushToken: appleWalletRegistrations.pushToken,
      })
      .from(appleWalletRegistrations)
      .where(eq(appleWalletRegistrations.serialNumber, params.cardId));

    if (registrations.length === 0) {
      return;
    }

    const template = getPushTemplate();

    // 2. Dispatch APNs push to each registered device
    await Promise.allSettled(
      registrations.map(async (reg) => {
        try {
          const res = await template.pushUpdates(reg.pushToken);
          const rawStatus = res[":status"];
          const statusCode = rawStatus ? Number(rawStatus) : 200;

          // 410 means device has unregistered or deleted the pass
          if (statusCode === 410) {
            await db
              .delete(appleWalletRegistrations)
              .where(eq(appleWalletRegistrations.id, reg.id));
          }
        } catch (pushError) {
          console.warn(
            `[AppleWalletSync] Failed to push update to device ${reg.deviceLibraryIdentifier}:`,
            pushError instanceof Error ? pushError.message : pushError
          );
        }
      })
    );
  } catch (error) {
    console.warn(
      `[AppleWalletSync] Error syncing Apple Wallet for card ${params.cardId}:`,
      error instanceof Error ? error.message : error
    );
  }
};

/**
 * Sends a push update to all registered Apple Wallet passes belonging to a loyalty program.
 */
export const broadcastAppleWalletNotification = async (
  programId: string
): Promise<number> => {
  try {
    if (!isAppleWalletConfigured()) {
      return 0;
    }

    const registrations = await db
      .select({
        deviceLibraryIdentifier:
          appleWalletRegistrations.deviceLibraryIdentifier,
        id: appleWalletRegistrations.id,
        pushToken: appleWalletRegistrations.pushToken,
      })
      .from(appleWalletRegistrations)
      .innerJoin(cards, eq(cards.id, appleWalletRegistrations.serialNumber))
      .where(eq(cards.programId, programId));

    if (registrations.length === 0) {
      return 0;
    }

    const template = getPushTemplate();
    let sentCount = 0;

    await Promise.allSettled(
      registrations.map(async (reg) => {
        try {
          const res = await template.pushUpdates(reg.pushToken);
          const rawStatus = res[":status"];
          const statusCode = rawStatus ? Number(rawStatus) : 200;

          if (statusCode === 410) {
            await db
              .delete(appleWalletRegistrations)
              .where(eq(appleWalletRegistrations.id, reg.id));
          } else {
            sentCount += 1;
          }
        } catch (pushError) {
          console.warn(
            `[AppleWalletBroadcast] Push failed for device ${reg.deviceLibraryIdentifier}:`,
            pushError instanceof Error ? pushError.message : pushError
          );
        }
      })
    );

    return sentCount;
  } catch (error) {
    console.warn(
      `[AppleWalletBroadcast] Error broadcasting to Apple Wallet for program ${programId}:`,
      error instanceof Error ? error.message : error
    );
    return 0;
  }
};
