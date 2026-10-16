import { redirect } from "next/navigation";

interface DashboardClientsPageProps {
  params: Promise<{ locale: string }>;
}

const DashboardClientsPage = async ({ params }: DashboardClientsPageProps) => {
  const { locale } = await params;
  redirect(`/${locale}/clients`);
};

export default DashboardClientsPage;
