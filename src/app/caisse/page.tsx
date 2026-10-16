import { redirect } from "next/navigation";

interface TopCaissePageProps {
  searchParams: Promise<{ code?: string }>;
}

const TopCaissePage = async ({ searchParams }: TopCaissePageProps) => {
  const { code } = await searchParams;
  const queryString = code ? `?code=${code}` : "";
  redirect(`/fr/caisse${queryString}`);
};

export default TopCaissePage;
