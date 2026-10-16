import { redirect } from "next/navigation";

interface DashboardAppearancePageProps {
  params: Promise<{ locale: string }>;
}

const DashboardAppearancePage = async ({
  params,
}: DashboardAppearancePageProps) => {
  const { locale } = await params;
  redirect(`/${locale}/appearance`);
};

export default DashboardAppearancePage;
