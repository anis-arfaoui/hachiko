"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { findCardByIdentifier } from "@/dal/card";
import type { CardDetailsWithCooldown } from "@/dal/card";
import {
  createCashier,
  deleteCashier,
  getCashierByCode,
  getCashierByToken,
  getCashiersLeaderboard,
  regenerateCashierCode,
} from "@/dal/cashier";
import type { CashierItem, CashierLeaderboardStats } from "@/dal/cashier";
import { getOrganizationLocations } from "@/dal/location";
import { getManagerSession } from "@/dal/manager";
import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";
import { getRewardsByProgramId } from "@/dal/rewards";
import { checkCanScan } from "@/dal/subscription";
import {
  addStampToCard,
  cancelTransaction,
  redeemCardReward,
} from "@/dal/transaction";
import type {
  AddStampResult,
  CancelTransactionResult,
  RedeemRewardResult,
} from "@/dal/transaction";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";

export interface CreateCashierResult {
  cashier?: CashierItem;
  error?: string;
  success: boolean;
}

export const createCashierAction = async (
  name: string,
  locationId?: string | null
): Promise<CreateCashierResult> => {
  const merchantSession = await getMerchantSession();
  const managerSession = merchantSession ? null : await getManagerSession();
  const organizationId =
    merchantSession?.organizationId || managerSession?.organizationId;

  if (!organizationId) {
    return { error: "UNAUTHORIZED", success: false };
  }

  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    return {
      error: "Veuillez entrer un prénom d'au moins 2 caractères.",
      success: false,
    };
  }

  try {
    const cashier = await createCashier(organizationId, trimmed, locationId);
    revalidatePath("/caisses");
    revalidatePath("/caisse");
    revalidatePath("/responsable/caisses");
    return { cashier, success: true };
  } catch (error) {
    console.error("Create cashier error:", error);
    return {
      error: "Erreur lors de la création de la caisse.",
      success: false,
    };
  }
};

export const deleteCashierAction = async (
  cashierId: string
): Promise<{ error?: string; success: boolean }> => {
  const merchantSession = await getMerchantSession();
  const managerSession = merchantSession ? null : await getManagerSession();
  const organizationId =
    merchantSession?.organizationId || managerSession?.organizationId;

  if (!organizationId) {
    return { error: "UNAUTHORIZED", success: false };
  }

  try {
    const deleted = await deleteCashier(organizationId, cashierId);
    revalidatePath("/caisses");
    revalidatePath("/responsable/caisses");
    return { success: deleted };
  } catch (error) {
    console.error("Delete cashier error:", error);
    return { error: "Erreur lors de la suppression.", success: false };
  }
};

export const regenerateCashierCodeAction = async (
  cashierId: string
): Promise<{ cashier?: CashierItem; error?: string; success: boolean }> => {
  const merchantSession = await getMerchantSession();
  const managerSession = merchantSession ? null : await getManagerSession();
  const organizationId =
    merchantSession?.organizationId || managerSession?.organizationId;

  if (!organizationId) {
    return { error: "UNAUTHORIZED", success: false };
  }

  try {
    const cashier = await regenerateCashierCode(organizationId, cashierId);
    if (!cashier) {
      return { error: "Caisse introuvable.", success: false };
    }
    revalidatePath("/caisses");
    revalidatePath("/responsable/caisses");
    return { cashier, success: true };
  } catch (error) {
    console.error("Regenerate cashier code error:", error);
    return { error: "Erreur lors de la régénération.", success: false };
  }
};

export interface CashiersDataResult {
  cashiers: CashierItem[];
  locations: {
    id: string;
    isDefault: boolean;
    name: string;
  }[];
  program: {
    brandColor: string;
    rewardLabel: string;
    stampsRequired: number;
    type: "points" | "stamps";
  } | null;
  stats: CashierLeaderboardStats[];
}

export const getCashiersDataAction = async (
  period: "7d" | "30d" | "all" | string = "30d"
): Promise<CashiersDataResult | null> => {
  const merchantSession = await getMerchantSession();
  const managerSession = merchantSession ? null : await getManagerSession();
  const organizationId =
    merchantSession?.organizationId || managerSession?.organizationId;

  if (!organizationId) {
    return null;
  }

  const [leaderboardData, program, locs] = await Promise.all([
    getCashiersLeaderboard(organizationId, period),
    getProgramByOrganization(organizationId),
    getOrganizationLocations(organizationId),
  ]);

  return {
    cashiers: leaderboardData.cashiers,
    locations: locs.map((l) => ({
      id: l.id,
      isDefault: l.isDefault,
      name: l.name,
    })),
    program: program
      ? {
          brandColor: program.brandColor,
          rewardLabel: program.rewardLabel,
          stampsRequired: program.stampsRequired,
          type: program.type === "points" ? "points" : "stamps",
        }
      : null,
    stats: leaderboardData.stats,
  };
};

export interface VerifyCashierResult {
  cashier?: {
    code: string;
    id: string;
    name: string;
    token: string;
  };
  error?: string;
  organization?: {
    id: string;
    logo: string | null;
    name: string;
    slug: string | null;
  };
  program?: {
    brandColor: string;
    id: string;
    rewardLabel: string;
    stampsRequired: number;
    type: "points" | "stamps";
  };
  rewards?: {
    cost: number;
    description: string | null;
    id: string;
    label: string;
  }[];
  success: boolean;
}

export const verifyCashierCodeAction = async (
  codeOrToken: string
): Promise<VerifyCashierResult> => {
  const trimmed = codeOrToken.trim();
  if (!trimmed) {
    return { error: "Code requis.", success: false };
  }

  // Lookup by 6-digit code or secure token
  let cashier = await getCashierByCode(trimmed);
  if (!cashier) {
    cashier = await getCashierByToken(trimmed);
  }

  if (!cashier) {
    return {
      error:
        "Code invalide. Vérifiez le code à 6 chiffres affiché par votre gérant.",
      success: false,
    };
  }

  const [orgRow, program] = await Promise.all([
    db
      .select({
        id: organization.id,
        logo: organization.logo,
        name: organization.name,
        slug: organization.slug,
      })
      .from(organization)
      .where(eq(organization.id, cashier.organizationId))
      .limit(1),
    getProgramByOrganization(cashier.organizationId),
  ]);

  const [org] = orgRow;
  if (!org || !program) {
    return { error: "Commerce ou programme introuvable.", success: false };
  }

  const rewardList = await getRewardsByProgramId(program.id);

  return {
    cashier: {
      code: cashier.code,
      id: cashier.id,
      name: cashier.name,
      token: cashier.token,
    },
    organization: {
      id: org.id,
      logo: org.logo,
      name: org.name,
      slug: org.slug,
    },
    program: {
      brandColor: program.brandColor,
      id: program.id,
      rewardLabel: program.rewardLabel,
      stampsRequired: program.stampsRequired,
      type: program.type === "points" ? "points" : "stamps",
    },
    rewards: rewardList.map((r) => ({
      cost: r.cost,
      description: r.description,
      id: r.id,
      label: r.label,
    })),
    success: true,
  };
};

export const cashierLookupCustomerAction = async (
  cashierCodeOrToken: string,
  identifier: string
): Promise<{
  card?: CardDetailsWithCooldown;
  error?: string;
  success: boolean;
}> => {
  const verifyRes = await verifyCashierCodeAction(cashierCodeOrToken);
  if (!verifyRes.success || !verifyRes.organization) {
    return { error: "UNAUTHORIZED_CASHIER", success: false };
  }

  const card = await findCardByIdentifier(
    verifyRes.organization.id,
    identifier
  );

  if (!card) {
    return { error: "CUSTOMER_NOT_FOUND", success: false };
  }

  return { card, success: true };
};

export interface CashierScanStampInput {
  amount?: number;
  cashierCodeOrToken: string;
  clientUuid: string;
  ignoreCooldown?: boolean;
  spendAmount?: number;
  token: string;
}

export const cashierScanStampAction = async (
  input: CashierScanStampInput
): Promise<
  | AddStampResult
  | {
      error: "SUBSCRIPTION_EXPIRED" | "UNAUTHORIZED_CASHIER";
      success: false;
    }
> => {
  const verifyRes = await verifyCashierCodeAction(input.cashierCodeOrToken);
  if (!verifyRes.success || !verifyRes.cashier || !verifyRes.organization) {
    return { error: "UNAUTHORIZED_CASHIER", success: false };
  }

  const canScan = await checkCanScan(verifyRes.organization.id);
  if (!canScan.allowed) {
    return { error: "SUBSCRIPTION_EXPIRED", success: false };
  }

  return addStampToCard({
    amount: input.amount,
    cashierId: verifyRes.cashier.id,
    clientUuid: input.clientUuid,
    ignoreCooldown: input.ignoreCooldown,
    organizationId: verifyRes.organization.id,
    spendAmount: input.spendAmount,
    token: input.token,
  });
};

export const cashierRedeemAction = async (
  cashierCodeOrToken: string,
  token: string,
  rewardId?: string
): Promise<
  | RedeemRewardResult
  | {
      error: "SUBSCRIPTION_EXPIRED" | "UNAUTHORIZED_CASHIER";
      success: false;
    }
> => {
  const verifyRes = await verifyCashierCodeAction(cashierCodeOrToken);
  if (!verifyRes.success || !verifyRes.cashier || !verifyRes.organization) {
    return { error: "UNAUTHORIZED_CASHIER", success: false };
  }

  const canScan = await checkCanScan(verifyRes.organization.id);
  if (!canScan.allowed) {
    return { error: "SUBSCRIPTION_EXPIRED", success: false };
  }

  return redeemCardReward({
    cashierId: verifyRes.cashier.id,
    organizationId: verifyRes.organization.id,
    rewardId,
    token,
  });
};

export const cashierCancelTransactionAction = async (
  cashierCodeOrToken: string,
  transactionId: string
): Promise<
  CancelTransactionResult | { error: "UNAUTHORIZED_CASHIER"; success: false }
> => {
  const verifyRes = await verifyCashierCodeAction(cashierCodeOrToken);
  if (!verifyRes.success || !verifyRes.organization) {
    return { error: "UNAUTHORIZED_CASHIER", success: false };
  }

  return cancelTransaction({
    organizationId: verifyRes.organization.id,
    transactionId,
  });
};
