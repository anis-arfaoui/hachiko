import { redirect } from "next/navigation";

interface DashboardQrCodePageProps {
  params: Promise<{ locale: string }>;
}

const DashboardQrCodePage = async ({ params }: DashboardQrCodePageProps) => {
  const { locale } = await params;
  redirect(`/${locale}/qrcode`);
};

export default DashboardQrCodePage;
