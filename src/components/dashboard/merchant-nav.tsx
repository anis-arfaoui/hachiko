"use client";

import {
  BarChart3,
  CreditCard,
  Eye,
  Gift,
  LogOut,
  Menu,
  Palette,
  Plus,
  QrCode,
  ScanLine,
  Settings,
  Shield,
  Star,
  Store,
  Users,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { getLocationsAction } from "@/app/actions/location";
import { AddStoreModal } from "@/components/dashboard/add-store-modal";
import { CardPreviewModal } from "@/components/dashboard/card-preview-modal";
import { StoreSwitcher } from "@/components/dashboard/store-switcher";
import type { LocationItem } from "@/dal/location";
import { signOut, useActiveOrganization } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface MerchantNavProps {
  children: ReactNode;
  initialOrgName?: string;
}

export const MerchantNav = ({
  children,
  initialOrgName = "Mon Commerce",
}: MerchantNavProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Multi-Store State
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const [allowedPointsOfSale, setAllowedPointsOfSale] = useState(1);
  const [planName, setPlanName] = useState("Starter");
  const [isCardPreviewOpen, setIsCardPreviewOpen] = useState(false);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLocations = async () => {
      const res = await getLocationsAction();
      if (res && isMounted) {
        setLocations(res.locations);
        setAllowedPointsOfSale(res.allowedPointsOfSale);
        setPlanName(res.plan === "pro" ? "Pro" : "Starter");
        const defaultLoc =
          res.locations.find((l) => l.isDefault) || res.locations[0];
        if (defaultLoc) {
          setSelectedLocationId(defaultLoc.id);
        }
      }
    };
    void fetchLocations();
    return () => {
      isMounted = false;
    };
  }, []);

  const { data: activeOrg } = useActiveOrganization();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const navLinks = [
    {
      aliases: [`/${locale}/dashboard`],
      href: `/dashboard`,
      icon: BarChart3,
      label: "Tableau de bord",
    },
    {
      aliases: [
        "/client",
        "/dashboard/clients",
        `/${locale}/clients`,
        `/${locale}/client`,
        `/${locale}/dashboard/clients`,
      ],
      href: `/clients`,
      icon: Users,
      label: "Clients",
    },
    {
      aliases: [
        "/reward",
        "/dashboard/rewards",
        `/${locale}/rewards`,
        `/${locale}/reward`,
        `/${locale}/dashboard/rewards`,
      ],
      href: `/rewards`,
      icon: Gift,
      label: "Menu fidélité",
    },
    {
      aliases: [
        "/dashboard/program",
        `/${locale}/program`,
        `/${locale}/dashboard/program`,
      ],
      href: `/program`,
      icon: Star,
      label: "Programme",
    },
    {
      aliases: [
        "/dashboard/appearance",
        `/${locale}/appearance`,
        `/${locale}/dashboard/appearance`,
      ],
      href: `/appearance`,
      icon: Palette,
      label: "Apparence",
    },
    {
      aliases: [
        "/dashboard/qrcode",
        `/${locale}/qrcode`,
        `/${locale}/dashboard/qrcode`,
      ],
      href: `/qrcode`,
      icon: QrCode,
      label: "QR Code",
    },
    {
      aliases: [
        "/boutiques",
        "/stores",
        `/${locale}/boutiques`,
        `/${locale}/stores`,
      ],
      href: `/boutiques`,
      icon: Store,
      label: "Boutiques",
    },
    {
      aliases: [
        "/caisse-employe",
        "/cashier",
        "/cashiers",
        `/${locale}/caisses`,
        `/${locale}/caisse-employe`,
        `/${locale}/cashier`,
        `/${locale}/cashiers`,
      ],
      href: `/caisses`,
      icon: ScanLine,
      label: "Caisses employé",
    },
    {
      aliases: [
        "/responsable",
        "/responsables",
        `/${locale}/responsables`,
        `/${locale}/responsable`,
      ],
      href: `/responsables`,
      icon: Shield,
      label: "Responsables",
    },
    {
      aliases: [`/${locale}/till`],
      href: `/till`,
      icon: ScanLine,
      label: "Scanner de caisse",
    },
    {
      aliases: [
        "/billing",
        "/abonnement",
        "/dashboard/billing",
        "/dashboard/abonnement",
        `/${locale}/billing`,
        `/${locale}/abonnement`,
        `/${locale}/dashboard/billing`,
        `/${locale}/dashboard/abonnement`,
      ],
      href: `/billing`,
      icon: CreditCard,
      label: "Abonnement",
    },
    {
      aliases: [
        "/parametres",
        "/dashboard/settings",
        "/dashboard/parametres",
        `/${locale}/settings`,
        `/${locale}/parametres`,
        `/${locale}/dashboard/settings`,
        `/${locale}/dashboard/parametres`,
      ],
      href: `/settings`,
      icon: Settings,
      label: "Paramètres",
    },
  ];

  const orgName = activeOrg?.name || initialOrgName;
  const currentStore =
    locations.find((l) => l.id === selectedLocationId) || locations[0];

  return (
    <div className="bg-background text-foreground flex min-h-screen">
      {/* 1. Desktop Left Sidebar */}
      <aside className="border-border bg-card sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r p-5 md:flex">
        {/* Top Section: Logo & Navigation */}
        <div className="space-y-6">
          {/* Brand header */}
          <Link
            href="/dashboard"
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

          {/* Commerce & Multi-Store Hub */}
          <div className="border-border bg-muted/40 space-y-2 rounded-2xl border p-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 text-primary border-border relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                {activeOrg?.logo ? (
                  <Image
                    src={activeOrg.logo}
                    alt={orgName}
                    fill
                    sizes="36px"
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
                <div className="text-muted-foreground truncate text-[10px]">
                  {currentStore
                    ? currentStore.city || currentStore.name
                    : "Espace Commerçant"}
                </div>
              </div>
            </div>

            {/* Store Switcher (if 2+ stores) */}
            {locations.length > 1 && (
              <StoreSwitcher
                locations={locations}
                selectedLocationId={selectedLocationId}
                onSelectStore={(id) => setSelectedLocationId(id)}
                onAddStoreClick={() => setIsAddStoreOpen(true)}
              />
            )}

            {/* Quick Actions: Voir carte client & Ajouter boutique */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsCardPreviewOpen(true)}
                className="border-border bg-card hover:bg-muted text-foreground flex items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-[11px] font-semibold shadow-2xs transition-all"
                title="Voir la carte client"
              >
                <Eye className="text-primary h-3.5 w-3.5" />
                <span>Voir carte</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddStoreOpen(true)}
                className="border-border bg-card hover:bg-muted text-foreground flex items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-[11px] font-semibold shadow-2xs transition-all"
                title="Ajouter une boutique"
              >
                <Plus className="h-3.5 w-3.5 text-emerald-500" />
                <span>Boutique</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                Boolean(item.aliases?.includes(pathname));

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
          <Link href="/dashboard" className="flex items-center gap-2.5">
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

                {/* Store Hub for Mobile */}
                <div className="border-border bg-muted/40 space-y-2 rounded-2xl border p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 text-primary border-border relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                      {activeOrg?.logo ? (
                        <Image
                          src={activeOrg.logo}
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
                    <div className="min-w-0 flex-1 truncate text-xs font-bold">
                      {orgName}
                    </div>
                  </div>

                  {locations.length > 1 && (
                    <StoreSwitcher
                      locations={locations}
                      selectedLocationId={selectedLocationId}
                      onSelectStore={(id) => setSelectedLocationId(id)}
                      onAddStoreClick={() => {
                        setMobileMenuOpen(false);
                        setIsAddStoreOpen(true);
                      }}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsCardPreviewOpen(true);
                      }}
                      className="border-border bg-card hover:bg-muted text-foreground flex items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-[11px] font-semibold"
                    >
                      <Eye className="text-primary h-3.5 w-3.5" />
                      <span>Voir carte</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsAddStoreOpen(true);
                      }}
                      className="border-border bg-card hover:bg-muted text-foreground flex items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-[11px] font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Boutique</span>
                    </button>
                  </div>
                </div>

                <nav className="space-y-1">
                  {navLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      Boolean(item.aliases?.includes(pathname));

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

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Live Modals */}
      <CardPreviewModal
        isOpen={isCardPreviewOpen}
        onClose={() => setIsCardPreviewOpen(false)}
      />

      <AddStoreModal
        isOpen={isAddStoreOpen}
        onClose={() => setIsAddStoreOpen(false)}
        allowedCount={allowedPointsOfSale}
        currentCount={locations.filter((l) => l.status === "active").length}
        planName={planName}
        onSuccess={(newLoc) => {
          setLocations((prev) => [...prev, newLoc]);
          setSelectedLocationId(newLoc.id);
        }}
      />
    </div>
  );
};
