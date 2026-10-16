import { QrCodeView } from "@/components/dashboard/qr-code-view";
import { getManagerSession } from "@/dal/manager";
import { getProgramByOrganization } from "@/dal/program";

interface ResponsableQrCodePageProps {
  params: Promise<{ locale: string }>;
}

const ResponsableQrCodePage = async ({
  params,
}: ResponsableQrCodePageProps) => {
  const [{ locale }, session] = await Promise.all([
    params,
    getManagerSession(),
  ]);

  if (!session) {
    return null;
  }

  const program =
    session.program || (await getProgramByOrganization(session.organizationId));
  const orgSlug = session.organization.slug || session.organization.id;

  return (
    <QrCodeView
      brandColor={program?.brandColor}
      businessName={session.organization.name}
      locale={locale}
      orgSlug={orgSlug}
    />
  );
};

export default ResponsableQrCodePage;
