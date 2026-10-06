"use server";

import { headers } from "next/headers";

import { getMerchantStats } from "@/dal/stats";
import { auth } from "@/lib/auth";

export const getDashboardDataAction = async () => {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user || !session.session.activeOrganizationId) {
    return null;
  }

  const organizationId = session.session.activeOrganizationId;
  const stats = await getMerchantStats(organizationId);

  return {
    organizationId,
    stats,
  };
};
