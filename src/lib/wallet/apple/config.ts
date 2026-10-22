import fs from "node:fs";
import path from "node:path";

export interface AppleWalletConfig {
  passCertPem: string;
  passKeyPassphrase?: string;
  passKeyPem: string;
  passTypeIdentifier: string;
  teamIdentifier: string;
  webServiceUrl: string;
  wwdrCertPem?: string;
}

const resolveSecret = (
  envDirect?: string,
  envPath?: string,
  defaultRelativePath?: string
): string => {
  if (envDirect && envDirect.trim().length > 0) {
    return envDirect.trim();
  }

  const filePath = envPath || defaultRelativePath;
  if (filePath) {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, "utf-8").trim();
    }
  }

  return "";
};

export const isAppleWalletConfigured = (): boolean => {
  const passTypeId = process.env.APPLE_PASS_TYPE_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const cert = resolveSecret(
    process.env.APPLE_PASS_CERT_PEM,
    process.env.APPLE_PASS_CERT_PATH,
    "certificates/apple/pass_cert.pem"
  );
  const key = resolveSecret(
    process.env.APPLE_PASS_KEY_PEM,
    process.env.APPLE_PASS_KEY_PATH,
    "certificates/apple/pass_key.pem"
  );

  return Boolean(passTypeId && teamId && cert && key);
};

export const getAppleWalletConfig = (): AppleWalletConfig => {
  const passTypeIdentifier =
    process.env.APPLE_PASS_TYPE_ID || "pass.com.walaa.loyalty";
  const teamIdentifier = process.env.APPLE_TEAM_ID || "MOCK_TEAM_ID";

  const passCertPem = resolveSecret(
    process.env.APPLE_PASS_CERT_PEM,
    process.env.APPLE_PASS_CERT_PATH,
    "certificates/apple/pass_cert.pem"
  );

  const passKeyPem = resolveSecret(
    process.env.APPLE_PASS_KEY_PEM,
    process.env.APPLE_PASS_KEY_PATH,
    "certificates/apple/pass_key.pem"
  );

  const wwdrCertPem = resolveSecret(
    process.env.APPLE_WWDR_CERT_PEM,
    process.env.APPLE_WWDR_CERT_PATH,
    "certificates/apple/wwdr.pem"
  );

  const passKeyPassphrase = process.env.APPLE_PASS_KEY_PASSPHRASE;

  // Apple PassKit Web Service root URL
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://loyalty.app";

  const webServiceUrl =
    process.env.APPLE_WEB_SERVICE_URL ||
    `${baseUrl.replace(/\/+$/u, "")}/api/wallet/apple`;

  return {
    passCertPem,
    passKeyPassphrase,
    passKeyPem,
    passTypeIdentifier,
    teamIdentifier,
    webServiceUrl,
    wwdrCertPem: wwdrCertPem || undefined,
  };
};
