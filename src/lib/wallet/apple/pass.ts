import fs from "node:fs";
import path from "node:path";

import type { Pass } from "@walletpass/pass-js";
import { Template, constants } from "@walletpass/pass-js";

import { getAppleWalletConfig, isAppleWalletConfigured } from "./config";

export interface ApplePassCardData {
  balance: number;
  brandColor?: string;
  businessName: string;
  cardId: string;
  customerCode?: string | null;
  customerName: string;
  customerPhone?: string | null;
  logoUrl?: string | null;
  programType?: string;
  rewardLabel?: string | null;
  stampsRequired: number;
  token: string;
}

export class AppleWalletNotConfiguredError extends Error {
  constructor(message = "Apple Wallet is not configured yet") {
    super(message);
    this.name = "AppleWalletNotConfiguredError";
  }
}

/**
 * Loads default fallback images for Apple Wallet passes
 */
const loadDefaultImages = async (pass: Pass): Promise<void> => {
  const iconCandidates = [
    path.join(process.cwd(), "public", "icon.png"),
    path.join(process.cwd(), "public", "images", "icon.png"),
  ];

  const logoCandidates = [
    path.join(process.cwd(), "public", "walaa-logo.png"),
    path.join(process.cwd(), "public", "logo-walaa.png"),
    path.join(process.cwd(), "public", "icon.png"),
  ];

  const iconPath = iconCandidates.find((p) => fs.existsSync(p));
  const logoPath = logoCandidates.find((p) => fs.existsSync(p));

  const tasks: Promise<void>[] = [];

  if (iconPath) {
    const iconBuf = fs.readFileSync(iconPath);
    tasks.push(pass.images.add("icon", iconBuf, "1x", undefined, true));
  }

  if (logoPath) {
    const logoBuf = fs.readFileSync(logoPath);
    tasks.push(pass.images.add("logo", logoBuf, "1x", undefined, true));
  }

  await Promise.all(tasks);
};

/**
 * Generates and cryptographically signs a .pkpass bundle buffer for Apple Wallet.
 */
export const generateApplePassBuffer = async (
  card: ApplePassCardData
): Promise<Buffer> => {
  if (!isAppleWalletConfigured()) {
    throw new AppleWalletNotConfiguredError(
      "Apple Wallet certificates or Pass Type ID are not configured. Please add APPLE_PASS_TYPE_ID, APPLE_TEAM_ID, and certificates in .env.local."
    );
  }

  const config = getAppleWalletConfig();

  const template = new Template("storeCard", {
    description: `Carte de fidélité ${card.businessName}`,
    organizationName: card.businessName,
    passTypeIdentifier: config.passTypeIdentifier,
    teamIdentifier: config.teamIdentifier,
  });

  template.setCertificate(config.passCertPem);
  template.setPrivateKey(config.passKeyPem, config.passKeyPassphrase);

  // Set web service URL and authentication token for auto-updates & push
  const pass = template.createPass({
    authenticationToken: card.token,
    serialNumber: card.cardId,
    webServiceURL: config.webServiceUrl,
  });

  const isPoints = card.programType === "points";
  const balanceValue = isPoints
    ? `${card.balance} / ${card.stampsRequired} pts`
    : `${card.balance} / ${card.stampsRequired}`;

  // Primary field (Center stage on pass)
  pass.primaryFields.add({
    changeMessage: isPoints
      ? "Votre solde de fidélité est passé à %@ !"
      : "Votre carte a été créditée : %@ tampons !",
    key: "balance",
    label: isPoints ? "POINTS" : "TAMPONS",
    value: balanceValue,
  });

  // Secondary fields
  pass.secondaryFields.add({
    key: "customerName",
    label: "TITULAIRE",
    value: card.customerName,
  });

  pass.secondaryFields.add({
    key: "reward",
    label: "RÉCOMPENSE",
    value: card.rewardLabel || "Cadeau offert",
  });

  // Auxiliary fields
  pass.auxiliaryFields.add({
    key: "status",
    label: "STATUT",
    value:
      card.balance >= card.stampsRequired
        ? "Récompense Débloquée ! 🎁"
        : "En cours",
  });

  if (card.customerCode) {
    pass.auxiliaryFields.add({
      key: "code",
      label: "CODE CLIENT",
      value: card.customerCode,
    });
  }

  // Back of the card (details, conditions)
  pass.backFields.add({
    key: "business",
    label: "ÉTABLISSEMENT",
    value: card.businessName,
  });

  pass.backFields.add({
    key: "terms",
    label: "CONDITIONS DU PROGRAMME",
    value: `Présentez ce pass lors de chaque passage en caisse. À ${card.stampsRequired} ${
      isPoints ? "points" : "tampons"
    }, votre récompense sera immédiatement disponible.`,
  });

  if (card.customerPhone) {
    pass.backFields.add({
      key: "phone",
      label: "TÉLÉPHONE CLIENT",
      value: card.customerPhone,
    });
  }

  // Barcode (QR Code)
  pass.barcodes = [
    {
      altText: card.customerCode || card.cardId,
      format: constants.barcodeFormat.QR,
      message: card.token,
      messageEncoding: "iso-8859-1",
    },
  ];

  // Visual appearance
  pass.backgroundColor = card.brandColor || "#18181b";
  pass.foregroundColor = "#ffffff";
  pass.labelColor = "#d4d4d8";

  // Assets
  await loadDefaultImages(pass);

  return await pass.asBuffer();
};
