import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getMerchantSession } from "@/dal/merchant";

interface TillLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const TillLayout = async ({ children, params }: TillLayoutProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (!merchantSession) {
    redirect(`/${locale}/sign-in`);
  }

  return children;
};

export default TillLayout;
