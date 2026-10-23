import { redirect } from "next/navigation";

import { NotificationsView } from "@/components/dashboard/notifications-view";
import { getMerchantSession } from "@/dal/merchant";
import {
  getBroadcastAudienceStats,
  getNotificationHistory,
} from "@/dal/notification";

interface NotificationsPageProps {
  params: Promise<{ locale: string }>;
}

const NotificationsPage = async ({ params }: NotificationsPageProps) => {
  const [, merchantSession] = await Promise.all([params, getMerchantSession()]);

  if (!merchantSession) {
    redirect("/sign-in");
  }

  const [stats, history] = await Promise.all([
    getBroadcastAudienceStats(merchantSession.organizationId),
    getNotificationHistory(merchantSession.organizationId),
  ]);

  return (
    <NotificationsView
      businessLogo={merchantSession.organization.logo}
      businessName={merchantSession.organization.name}
      initialHistory={history}
      initialStats={stats}
    />
  );
};

export default NotificationsPage;
