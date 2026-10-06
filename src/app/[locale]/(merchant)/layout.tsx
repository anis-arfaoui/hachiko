"use client";

import { BarChart3, LogOut, QrCode, Settings, Store } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { signOut, useActiveOrganization } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface MerchantLayoutProps {
  children: ReactNode;
}

const MerchantLayout = ({ children }: MerchantLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const { data: activeOrg } = useActiveOrganization();

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}/sign-in`);
  };

  const navLinks = [
    {
      href: `/${locale}/dashboard`,
      icon: BarChart3,
      label: "Tableau de bord",
    },
    {
      href: `/${locale}/dashboard/program`,
      icon: Settings,
      label: "Programme",
    },
    {
      href: `/${locale}/till`,
      icon: QrCode,
      label: "Scanner de caisse",
    },
  ];

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Top Navigation */}
      <header className="border-border bg-card/90 sticky top-0 z-40 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-6">
            <Link
              href={`/${locale}/dashboard`}
              className="text-foreground flex items-center gap-2.5 text-lg font-bold transition-opacity hover:opacity-90"
            >
              <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg shadow-sm">
                <Store className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight">
                  {activeOrg?.name ?? "Mon Commerce"}
                </span>
                <span className="text-muted-foreground text-xs font-normal">
                  Fidélité Digitale
                </span>
              </div>
            </Link>

            {/* Nav items */}
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/till`}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hidden items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium shadow-sm transition-colors sm:inline-flex"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Ouvrir Scanner</span>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              title="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default MerchantLayout;
