"use server";

import { revalidatePath } from "next/cache";

import {
  adminApproveStore,
  adminApproveSubscription,
  adminManualEditSubscription,
  adminSwitchActiveOrg,
  getAdminOrganizations,
  getAdminPendingStores,
  getAdminPendingSubscriptions,
  getAdminSession,
  getAdminStats,
} from "@/dal/admin";
import type { SubscriptionStatus } from "@/dal/subscription";

export const getAdminDataAction = async () => {
  const session = await getAdminSession();
  if (!session) {
    return null;
  }

  const [stats, pendingStores, pendingSubscriptions, organizations] =
    await Promise.all([
      getAdminStats(),
      getAdminPendingStores(),
      getAdminPendingSubscriptions(),
      getAdminOrganizations(),
    ]);

  return {
    adminUser: session.user,
    organizations,
    pendingStores,
    pendingSubscriptions,
    stats,
  };
};

export const adminApproveStoreAction = async (locationId: string) => {
  const session = await getAdminSession();
  if (!session) {
    return {
      error: "Accès refusé. Administrateur uniquement.",
      success: false,
    };
  }

  const res = await adminApproveStore(locationId);

  if (res.success) {
    revalidatePath("/admin");
    revalidatePath("/boutiques");
    revalidatePath("/dashboard");
    revalidatePath("/caisses");
  }

  return res;
};

export const adminApproveSubscriptionAction = async (
  organizationId: string,
  options?: {
    customMonths?: number;
    plan?: "starter" | "pro";
  }
) => {
  const session = await getAdminSession();
  if (!session) {
    return {
      error: "Accès refusé. Administrateur uniquement.",
      success: false,
    };
  }

  const res = await adminApproveSubscription(organizationId, options);

  if (res.success) {
    revalidatePath("/admin");
    revalidatePath("/billing");
    revalidatePath("/dashboard");
    revalidatePath("/boutiques");
  }

  return res;
};

export const adminManualEditSubscriptionAction = async (
  organizationId: string,
  data: {
    addMonths?: number;
    exactExpiresAt?: string;
    hasNfcPlaque?: boolean;
    plan?: "starter" | "pro";
    pointsOfSale?: number;
    status: SubscriptionStatus;
  }
) => {
  const session = await getAdminSession();
  if (!session) {
    return {
      error: "Accès refusé. Administrateur uniquement.",
      success: false,
    };
  }

  const res = await adminManualEditSubscription(organizationId, data);

  if (res.success) {
    revalidatePath("/admin");
    revalidatePath("/billing");
    revalidatePath("/dashboard");
    revalidatePath("/boutiques");
  }

  return res;
};

export const adminSwitchOrgAction = async (organizationId: string) => {
  const session = await getAdminSession();
  if (!session) {
    return {
      error: "Accès refusé. Administrateur uniquement.",
      success: false,
    };
  }

  const res = await adminSwitchActiveOrg(organizationId);

  if (res.success) {
    revalidatePath("/dashboard");
    revalidatePath("/clients");
    revalidatePath("/program");
    revalidatePath("/rewards");
  }

  return res;
};
