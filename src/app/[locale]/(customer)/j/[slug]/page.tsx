import { CustomerJoinForm } from "@/components/card/customer-join-form";

interface CustomerJoinPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

const CustomerJoinPage = async ({ params }: CustomerJoinPageProps) => {
  const { locale, slug } = await params;

  return <CustomerJoinForm locale={locale} slug={slug} />;
};

export default CustomerJoinPage;
