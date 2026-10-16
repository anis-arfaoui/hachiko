import type { ReactNode } from "react";
import { Suspense } from "react";

import { ManagerActivationView } from "@/components/manager/manager-activation-view";
import { ManagerNav } from "@/components/manager/manager-nav";
import { getManagerSession } from "@/dal/manager";

interface ResponsableLayoutProps {
  children: ReactNode;
}

const ResponsableLayout = async ({ children }: ResponsableLayoutProps) => {
  const session = await getManagerSession();

  if (!session) {
    return (
      <Suspense fallback={null}>
        <ManagerActivationView />
      </Suspense>
    );
  }

  return (
    <ManagerNav
      managerName={session.manager.name}
      orgLogo={session.organization.logo}
      orgName={session.organization.name}
      orgSlug={session.organization.slug}
    >
      {children}
    </ManagerNav>
  );
};

export default ResponsableLayout;
