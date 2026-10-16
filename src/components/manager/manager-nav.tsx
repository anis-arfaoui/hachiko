"use client";

import {
  BarChart3,
  Gift,
  LogOut,
  Menu,
  QrCode,
  ScanLine,
  Store,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { logoutManagerAction } from "@/app/actions/manager";
import { cn } from "@/lib/utils";

interface ManagerNavProps {
  children: ReactNode;
  managerName?: string;
  orgLogo?: string | null;
  orgName: string;
  orgSlug?: string | null;
}

const handleSignOut = async () => {
  await logoutManagerAction();
  window.location.href = "/responsable";
};

const NAV_LINKS = [
  {
    aliases: ["/responsable"],
    href: "/responsable",
    icon: BarChart3,
    label: "Tableau de bord",
  },
  {
    aliases: ["/responsable/rewards", "/responsable/reward"],
    href: "/responsable/rewards",
    icon: Gift,
    label: "Menu fidélité",
  },
  {
    aliases: ["/responsable/qrcode"],
    href: "/responsable/qrcode",
    icon: QrCode,
    label: "QR Code",
  },
  {
    aliases: [
      "/responsable/caisses",
      "/responsable/caisse",
      "/responsable/cashiers",
    ],
    href: "/responsable/caisses",
    icon: ScanLine,
    label: "Caisses employé",
  },
  {
    aliases: ["/responsable/scanner", "/responsable/till"],
    href: "/responsable/scanner",
    icon: ScanLine,
    label: "Scanner de caisse",
  },
];

export const ManagerNav = ({ children, orgLogo, orgName }: ManagerNavProps) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-background text-foreground flex min-h-screen">
      {/* 1. Desktop Left Sidebar */}
      <aside className="border-border bg-card sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r p-5 md:flex">
        {/* Top Section: Brand & Navigation */}
        <div className="space-y-6">
          {/* Brand header */}
          <Link
            href="/responsable"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <Image
              src="/walaa-logo.png"
              alt="Walaa"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover shadow-xs"
            />
            <div className="flex flex-col">
              <span className="text-foreground text-lg leading-none font-black tracking-tight">
                Walaa
              </span>
              <span className="text-muted-foreground mt-0.5 text-[11px] font-medium">
                Fidélité Digitale
              </span>
            </div>
          </Link>

          {/* Commerce Badge */}
          <div className="border-border bg-muted/40 flex items-center gap-2.5 rounded-xl border p-2.5">
            <div className="bg-primary/10 text-primary relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
              {orgLogo ? (
                <Image
                  src={orgLogo}
                  alt={orgName}
                  fill
                  sizes="32px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Store className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-foreground truncate text-xs font-bold">
                {orgName}
              </div>
              <div className="text-muted-foreground text-[10px]">
                Espace Responsable
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/responsable"
                  ? pathname === "/responsable"
                  : pathname === item.href ||
                    Boolean(item.aliases?.some((a) => pathname.startsWith(a)));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Déconnexion */}
        <div className="border-border border-t pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Header & Drawer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-card/90 sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xs md:hidden">
          <Link href="/responsable" className="flex items-center gap-2.5">
            <Image
              src="/walaa-logo.png"
              alt="Walaa"
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
            <span className="text-foreground max-w-[160px] truncate text-sm font-bold">
              {orgName}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Ouvrir le menu"
            className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Mobile slide-over drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-background/80 fixed inset-0 backdrop-blur-xs transition-opacity"
            />

            <div className="border-border bg-card relative z-10 flex h-full w-4/5 max-w-xs flex-col justify-between border-r p-5 shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src="/walaa-logo.png"
                      alt="Walaa"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="text-foreground text-base font-bold">
                      Walaa
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Fermer"
                    className="text-muted-foreground hover:text-foreground rounded-lg p-1.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="border-border bg-muted/40 rounded-xl border p-2.5 text-xs font-semibold">
                  <div className="text-foreground truncate">{orgName}</div>
                </div>

                <nav className="space-y-1">
                  {NAV_LINKS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/responsable"
                        ? pathname === "/responsable"
                        : pathname === item.href ||
                          Boolean(
                            item.aliases?.some((a) => pathname.startsWith(a))
                          );

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-border border-t pt-4">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area: identical padding and structure to MerchantNav */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
