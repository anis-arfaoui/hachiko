import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getMerchantSession } from "@/dal/merchant";

interface AuthLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const AuthLayout = async ({ children, params }: AuthLayoutProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (merchantSession) {
    redirect(`/${locale}/dashboard`);
  }

  return children;
};

export default AuthLayout;
