import { redirect } from "next/navigation";

interface DashboardRewardsPageProps {
  params: Promise<{ locale: string }>;
}

const DashboardRewardsPage = async ({ params }: DashboardRewardsPageProps) => {
  const { locale } = await params;
  redirect(`/${locale}/rewards`);
};

export default DashboardRewardsPage;
