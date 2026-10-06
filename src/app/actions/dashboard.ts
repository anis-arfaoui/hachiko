"use server";

import { getMerchantSession } from "@/dal/merchant";
import { getMerchantStats } from "@/dal/stats";

export const getDashboardDataAction = async () => {
  const merchantSession = await getMerchantSession();

  if (!merchantSession) {
    return null;
  }

  const stats = await getMerchantStats(merchantSession.organizationId);

  return {
    organization: merchantSession.organization,
    organizationId: merchantSession.organizationId,
    stats,
  };
};
