import fs from "node:fs";
import path from "node:path";

export interface GoogleWalletConfig {
  clientEmail: string;
  issuerId: string;
  privateKey: string;
  projectId: string;
}

let cachedConfig: GoogleWalletConfig | null = null;

export const formatPrivateKey = (rawInput: string): string => {
  if (!rawInput) {
    return "";
  }

  let str = rawInput.trim();

  // 1. If someone pasted the entire JSON service account file
  if (str.startsWith("{") && str.endsWith("}")) {
    try {
      const parsed = JSON.parse(str) as { private_key?: string };
      if (parsed.private_key) {
        str = parsed.private_key.trim();
      }
    } catch {
      // Ignore JSON parse error and continue
    }
  }

  // 2. Strip surrounding quotes if present
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }

  // 3. Replace all variations of escaped newlines
  str = str
    .replaceAll("\\\\r\\\\n", "\n")
    .replaceAll("\\\\n", "\n")
    .replaceAll("\\r\\n", "\n")
    .replaceAll("\\n", "\n")
    .replaceAll("\r\n", "\n");

  const beginMarker = "-----BEGIN PRIVATE KEY-----";
  const endMarker = "-----END PRIVATE KEY-----";

  let base64Body = "";
  if (str.includes(beginMarker) && str.includes(endMarker)) {
    const startIdx = str.indexOf(beginMarker) + beginMarker.length;
    const endIdx = str.indexOf(endMarker);
    base64Body = str.slice(startIdx, endIdx);
  } else if (str.includes(beginMarker)) {
    base64Body = str.slice(str.indexOf(beginMarker) + beginMarker.length);
  } else {
    base64Body = str;
  }

  // Remove ALL whitespace from the base64 body (spaces, newlines, tabs)
  const cleanBase64 = base64Body.replaceAll(/\s+/gu, "");

  // Re-chunk into standard 64-character PEM lines
  const chunks = cleanBase64.match(/.{1,64}/gu) || [];

  return `${beginMarker}\n${chunks.join("\n")}\n${endMarker}\n`;
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
