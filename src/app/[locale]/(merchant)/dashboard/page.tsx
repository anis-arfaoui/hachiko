import { redirect } from "next/navigation";

import { AnalyticsSection } from "@/components/dashboard/analytics-section";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { ReferralSection } from "@/components/dashboard/referral-section";
import { SegmentationSection } from "@/components/dashboard/segmentation-section";
import { getMerchantSession } from "@/dal/merchant";
import { getMerchantStats } from "@/dal/stats";

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

  const stats = await getMerchantStats(merchantSession.organizationId);
  const orgSlug =
    merchantSession.organization.slug || merchantSession.organization.id;

  return (
    <div className="space-y-6">
      {/* 1. Header: Tableau de bord + Client Join Link */}
      <DashboardHeader locale={locale} orgSlug={orgSlug} />

      {/* 3. 4 High-impact KPI Cards */}
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

      {/* 5. Smart Customer Segmentation Cards */}
      <SegmentationSection
        inactiveCustomers={stats.inactiveCustomers}
        topCustomers={stats.topCustomers}
      />

      {/* 6. Referral Card */}
      <ReferralSection />

      {/* 7. Live Recent Activity Feed */}
      <RecentActivityFeed activities={stats.recentActivity} />
    </div>
  );
};

export default DashboardPage;
