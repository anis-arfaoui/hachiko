import fs from "node:fs";
import path from "node:path";

export interface GoogleWalletConfig {
  clientEmail: string;
  issuerId: string;
  privateKey: string;
  projectId: string;
}

let cachedConfig: GoogleWalletConfig | null = null;

export const formatPrivateKey = (key: string): string => {
  if (!key) {
    return "";
  }

  let cleaned = key.trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  cleaned = cleaned
    .replaceAll("\\\\r\\\\n", "\n")
    .replaceAll("\\\\n", "\n")
    .replaceAll("\\r\\n", "\n")
    .replaceAll("\\n", "\n")
    .replaceAll("\r\n", "\n");

  return cleaned;
};

export const getGoogleWalletConfig = (): GoogleWalletConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || "3388000000023206839";

  // Check if direct environment variables are provided (e.g. on Vercel)
  if (
    process.env.GOOGLE_WALLET_CLIENT_EMAIL &&
    process.env.GOOGLE_WALLET_PRIVATE_KEY
  ) {
    cachedConfig = {
      clientEmail: process.env.GOOGLE_WALLET_CLIENT_EMAIL.trim(),
      issuerId: issuerId.trim(),
      privateKey: formatPrivateKey(process.env.GOOGLE_WALLET_PRIVATE_KEY),
      projectId: process.env.GOOGLE_WALLET_PROJECT_ID || "walaa-loyalty-511913",
    };
    return cachedConfig;
  }

  // Otherwise, read from the service account key JSON file
  const keyFileName =
    process.env.GOOGLE_WALLET_KEY_FILE || "google-wallet-key.json";

  const possiblePaths = [
    path.isAbsolute(keyFileName)
      ? keyFileName
      : path.resolve(process.cwd(), keyFileName),
    path.resolve(process.cwd(), "loyalty-app", keyFileName),
  ];

  if (import.meta.dirname) {
    possiblePaths.push(
      path.resolve(import.meta.dirname, "../../../..", keyFileName),
      path.resolve(
        import.meta.dirname,
        "../../../../../loyalty-app",
        keyFileName
      )
    );
  }

  const keyFilePath = possiblePaths.find((p) => fs.existsSync(p));

  if (!keyFilePath) {
    throw new Error(
      `Google Wallet key file not found. Checked: ${possiblePaths.join(", ")}. Ensure GOOGLE_WALLET_KEY_FILE is set or google-wallet-key.json exists.`
    );
  }

  try {
    const rawContent = fs.readFileSync(keyFilePath, "utf-8");
    const parsed = JSON.parse(rawContent) as {
      client_email?: string;
      private_key?: string;
      project_id?: string;
    };

    if (!parsed.client_email || !parsed.private_key) {
      throw new Error(
        "Invalid Google Wallet key file: missing client_email or private_key."
      );
    }

    cachedConfig = {
      clientEmail: parsed.client_email.trim(),
      issuerId: issuerId.trim(),
      privateKey: formatPrivateKey(parsed.private_key),
      projectId: parsed.project_id || "walaa-loyalty-511913",
    };

    return cachedConfig;
  } catch (error) {
    throw new Error(
      `Failed to parse Google Wallet key file: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
};
