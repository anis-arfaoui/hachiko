import { redirect } from "next/navigation";

import { AnalyticsSection } from "@/components/dashboard/analytics-section";
import { ClientInvitationCard } from "@/components/dashboard/client-invitation-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ManagersCard } from "@/components/dashboard/managers-card";
import { QuotaBanner } from "@/components/dashboard/quota-banner";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { ReferralSection } from "@/components/dashboard/referral-section";
import { SegmentationSection } from "@/components/dashboard/segmentation-section";
import { getManagersByOrganization } from "@/dal/manager";
import { getMerchantSession } from "@/dal/merchant";
import { getMerchantStats } from "@/dal/stats";
import { getSubscriptionDetails } from "@/dal/subscription";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

const DashboardPage = async ({ params }: DashboardPageProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (!merchantSession) {
    redirect("/sign-in");
  }

  const [stats, managers, subscriptionDetails] = await Promise.all([
    getMerchantStats(merchantSession.organizationId),
    getManagersByOrganization(merchantSession.organizationId),
    getSubscriptionDetails(merchantSession.organizationId),
  ]);

  const orgSlug =
    merchantSession.organization.slug || merchantSession.organization.id;

  return (
    <div className="space-y-6">
      {/* 1. Top Quota Banner */}
      <QuotaBanner subscriptionDetails={subscriptionDetails} />

      {/* 2. Header: VUE D'ENSEMBLE + Client Join Link + QR */}
      <DashboardHeader
        businessName={merchantSession.organization.name}
        locale={locale}
        orgSlug={orgSlug}
      />

      {/* 3. 4 Standardized KPI StatCards */}
      <KpiCards
        totalCustomers={stats.totalCustomers}
        totalRevenueDA={stats.totalRevenueDA}
        totalRewardsRedeemed={stats.totalRewardsRedeemed}
        totalTransactions={stats.totalTransactions}
      />

      {/* 4. Visual 30-Day Activity & Retention Analytics */}
      <AnalyticsSection
        dailyVisits={stats.dailyVisits}
        peakDailyVisits={stats.peakDailyVisits}
        repeatCustomersCount={stats.repeatCustomersCount}
        repeatRate={stats.repeatRate}
        totalNewThisMonth={stats.totalNewThisMonth}
        totalVisits30Days={stats.totalVisits30Days}
      />

      {/* 5. Vos Responsables Widget */}
      <ManagersCard
        managers={managers}
        orgName={merchantSession.organization.name}
      />

      {/* 6. Smart Customer Segmentation */}
      <SegmentationSection
        inactiveCustomers={stats.inactiveCustomers}
        topCustomers={stats.topCustomers}
      />

      {/* 7. Referral Card */}
      <ReferralSection />

      {/* 8. Recent Transactions Table */}
      <RecentActivityFeed activities={stats.recentActivity} />

      {/* 9. Client Invitation Card (Bottom Banner) */}
      <ClientInvitationCard
        businessName={merchantSession.organization.name}
        orgSlug={orgSlug}
      />
    </div>
  );
};

export default DashboardPage;
