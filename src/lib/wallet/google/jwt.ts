import crypto from "node:crypto";

import { ensureLoyaltyClass } from "./class";
import type { ProgramClassData } from "./class";
import { getGoogleWalletConfig } from "./config";
import { buildLoyaltyObjectPayload, ensureLoyaltyObject } from "./object";
import type { CardObjectData } from "./object";

export interface CreateWalletSaveUrlParams {
  card: CardObjectData;
  program: ProgramClassData;
}

export interface GoogleWalletSaveClaims {
  aud: string;
  iat: number;
  iss: string;
  origins: string[];
  payload: {
    loyaltyObjects: unknown[];
  };
  typ: string;
}

const base64UrlEncode = (str: string): string =>
  Buffer.from(str).toString("base64url");

export const createGoogleWalletSaveJwt = (
  claims: GoogleWalletSaveClaims
): string => {
  const config = getGoogleWalletConfig();

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(dataToSign);
  const signature = signer.sign(config.privateKey, "base64url");

  return `${dataToSign}.${signature}`;
};

export const generateGoogleWalletSaveUrl = async (
  params: CreateWalletSaveUrlParams
): Promise<string> => {
  const config = getGoogleWalletConfig();

  // 1. Ensure LoyaltyClass exists and is updated on Google servers
  await ensureLoyaltyClass(params.program);

  // 2. Build and upsert the LoyaltyObject
  const objectPayload = buildLoyaltyObjectPayload(params.card);
  await ensureLoyaltyObject(params.card);

  // 3. Assemble JWT claims
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const origins = [appUrl];
  if (!origins.includes("http://localhost:3000")) {
    origins.push("http://localhost:3000");
  }

  const jwtClaims: GoogleWalletSaveClaims = {
    aud: "google",
    iat: Math.floor(Date.now() / 1000),
    iss: config.clientEmail,
    origins,
    payload: {
      loyaltyObjects: [objectPayload],
    },
    typ: "savetowallet",
  };

  // 4. Sign JWT
  const signedJwt = createGoogleWalletSaveJwt(jwtClaims);

  // 5. Return official Google Wallet save link
  return `https://pay.google.com/gp/v/save/${signedJwt}`;
};
