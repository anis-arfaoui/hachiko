import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getMerchantSession } from "@/dal/merchant";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = async ({ children }: AuthLayoutProps) => {
  const merchantSession = await getMerchantSession();

  if (merchantSession) {
    redirect("/dashboard");
  }

  return children;
};

export default AuthLayout;
