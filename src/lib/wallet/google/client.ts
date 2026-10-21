import { google } from "googleapis";
import type { walletobjects_v1 } from "googleapis";

import { getGoogleWalletConfig } from "./config";

let cachedClient: walletobjects_v1.Walletobjects | null = null;

export const getGoogleWalletClient = (): walletobjects_v1.Walletobjects => {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getGoogleWalletConfig();

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });

  cachedClient = google.walletobjects({
    auth,
    version: "v1",
  });

  return cachedClient;
};
