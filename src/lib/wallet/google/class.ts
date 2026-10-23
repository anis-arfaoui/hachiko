import type { walletobjects_v1 } from "googleapis";

import { getGoogleWalletClient } from "./client";
import { getGoogleWalletConfig } from "./config";

export interface ProgramClassData {
  brandColor?: string;
  businessName: string;
  logoUrl?: string | null;
  programId: string;
}

const DEFAULT_LOGO_URL =
  "https://placehold.co/400x400/18181b/ffffff.png?text=Walaa";

export const getLoyaltyClassId = (programId: string): string => {
  const { issuerId } = getGoogleWalletConfig();
  return `${issuerId}.program_${programId.replaceAll(/[^a-zA-Z0-9_-]/gu, "_")}`;
};

export const ensureLoyaltyClass = async (
  data: ProgramClassData
): Promise<walletobjects_v1.Schema$LoyaltyClass> => {
  const client = getGoogleWalletClient();
  const classId = getLoyaltyClassId(data.programId);

  const hexColor = data.brandColor?.startsWith("#")
    ? data.brandColor
    : `#${data.brandColor || "18181b"}`;

  const validLogoUrl =
    data.logoUrl && data.logoUrl.startsWith("https://")
      ? data.logoUrl
      : DEFAULT_LOGO_URL;

  const classPayload: walletobjects_v1.Schema$LoyaltyClass = {
    hexBackgroundColor: hexColor,
    id: classId,
    issuerName: data.businessName,
    programLogo: {
      contentDescription: {
        defaultValue: {
          language: "fr-FR",
          value: `Logo ${data.businessName}`,
        },
      },
      sourceUri: {
        uri: validLogoUrl,
      },
    },
    programName: `Fidélité ${data.businessName}`,
    reviewStatus: "UNDER_REVIEW",
  };

  try {
    // Check if class already exists
    const existing = await client.loyaltyclass.get({ resourceId: classId });
    if (existing.data) {
      // Exclude reviewStatus from patch so we don't overwrite an APPROVED class
      const { reviewStatus: _omittedReviewStatus, ...patchPayload } =
        classPayload;
      const updated = await client.loyaltyclass.patch({
        requestBody: patchPayload,
        resourceId: classId,
      });
      return updated.data;
    }
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    if (status !== 404) {
      // If it's not a 404, log warning and try insert
      console.warn(
        `[GoogleWallet] loyaltyclass.get status ${status}:`,
        (error as Error).message
      );
    }
  }

  // Insert new LoyaltyClass
  const inserted = await client.loyaltyclass.insert({
    requestBody: classPayload,
  });

  return inserted.data;
};
