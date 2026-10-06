import { CustomerCardView } from "@/components/card/customer-card-view";

interface CustomerCardPageProps {
  params: Promise<{
    locale: string;
    token: string;
  }>;
}

const CustomerCardPage = async ({ params }: CustomerCardPageProps) => {
  const { token } = await params;

  return <CustomerCardView token={token} />;
};

export default CustomerCardPage;
