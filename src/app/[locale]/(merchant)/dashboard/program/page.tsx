import { redirect } from "next/navigation";

interface DashboardProgramPageProps {
  params: Promise<{ locale: string }>;
}

const DashboardProgramPage = async ({ params }: DashboardProgramPageProps) => {
  const { locale } = await params;
  redirect(`/${locale}/program`);
};

export default DashboardProgramPage;
