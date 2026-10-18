import { redirect } from "next/navigation";

import { getLocationsAction } from "@/app/actions/location";
import { LocationsView } from "@/components/dashboard/locations-view";
import { getMerchantSession } from "@/dal/merchant";

interface BoutiquesPageProps {
  params: Promise<{ locale: string }>;
}

const BoutiquesPage = async ({ params }: BoutiquesPageProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (!merchantSession) {
    redirect("/sign-in");
  }

  const data = await getLocationsAction();

  return (
    <LocationsView
      initialAllowedCount={data?.allowedPointsOfSale || 1}
      initialLocations={data?.locations || []}
      locale={locale}
      organizationName={data?.organizationName || "Mon Commerce"}
      planName={data?.plan === "pro" ? "Pro" : "Starter"}
    />
  );
};

export default BoutiquesPage;
