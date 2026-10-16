import { redirect } from "next/navigation";

import { QrCodeView } from "@/components/dashboard/qr-code-view";
import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";

interface QrCodePageProps {
  params: Promise<{ locale: string }>;
}

const QrCodePage = async ({ params }: QrCodePageProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (!merchantSession) {
    redirect(`/${locale}/sign-in`);
  }

  const program = await getProgramByOrganization(
    merchantSession.organizationId
  );
  const orgSlug =
    merchantSession.organization.slug || merchantSession.organization.id;

  return (
    <QrCodeView
      brandColor={program?.brandColor}
      businessName={merchantSession.organization.name}
      locale={locale}
      orgSlug={orgSlug}
    />
  );
};

export default QrCodePage;
