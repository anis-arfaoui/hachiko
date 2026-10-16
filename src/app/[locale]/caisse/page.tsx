import { CashierPortalView } from "@/components/cashier/cashier-portal-view";

interface CaissePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
}

const CaissePage = async ({ params, searchParams }: CaissePageProps) => {
  const [{ locale }, { code }] = await Promise.all([params, searchParams]);

  return <CashierPortalView initialCode={code || ""} locale={locale} />;
};

export default CaissePage;
