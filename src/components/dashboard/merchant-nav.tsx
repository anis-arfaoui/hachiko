"use client";

import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  CreditCard,
  Gift,
  LogOut,
  Menu,
  Palette,
  QrCode,
  ScanLine,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
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
import { StoreHeroCard } from "@/components/dashboard/store-hero-card";
import type { LocationItem } from "@/dal/location";
import type { SubscriptionDetails } from "@/dal/subscription";
import { signOut, useActiveOrganization } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface MerchantNavProps {
  children: ReactNode;
  initialOrgBanner?: string | null;
  initialOrgLogo?: string | null;
  initialOrgName?: string;
  initialOrgSlug?: string | null;
  isSuperAdmin?: boolean;
  subscriptionDetails?: SubscriptionDetails | null;
}

export const MerchantNav = ({
  children,
  initialOrgBanner,
  initialOrgLogo,
  initialOrgName = "Mon Commerce",
  initialOrgSlug,
  isSuperAdmin = false,
  subscriptionDetails,
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
        "/notifications",
        "/dashboard/notifications",
        `/${locale}/notifications`,
        `/${locale}/dashboard/notifications`,
      ],
      href: `/notifications`,
      icon: Bell,
      label: "Notifications",
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
    ...(isSuperAdmin
      ? [
          {
            aliases: ["/admin", `/${locale}/admin`],
            href: `/admin`,
            icon: ShieldCheck,
            label: "Super-Admin",
          },
        ]
      : []),
  ];

  const orgName = activeOrg?.name || initialOrgName;
  const logoUrl = activeOrg?.logo || initialOrgLogo || null;
  const slug = activeOrg?.slug || initialOrgSlug || null;
  const bannerUrl = initialOrgBanner || null;

  return (
    <div className="bg-background text-foreground flex min-h-screen">
      {/* 1. Desktop Left Sidebar */}
      <aside className="border-border bg-card sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r p-5 md:flex">
        {/* Top Section: Store Header & Navigation */}
        <div className="space-y-5">
          {/* Commerce & Multi-Store Hub (Sleek app-icon + ambient glow + domain pill aesthetic) */}
          <StoreHeroCard
            bannerUrl={bannerUrl}
            locations={locations}
            logoUrl={logoUrl}
            onOpenAddStore={() => setIsAddStoreOpen(true)}
            onOpenCardPreview={() => setIsCardPreviewOpen(true)}
            onSelectStore={(id) => setSelectedLocationId(id)}
            orgName={orgName}
            selectedLocationId={selectedLocationId}
            slug={slug}
          />

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
          <button
            type="button"
            onClick={() => setIsCardPreviewOpen(true)}
            className="flex items-center gap-2.5 text-left"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={orgName}
                width={28}
                height={28}
                className="h-7 w-7 rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
                <Store className="h-4 w-4" />
              </div>
            )}
            <span className="text-foreground max-w-[160px] truncate text-sm font-bold">
              {orgName}
            </span>
          </button>

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
              <div className="space-y-4">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Fermer"
                    className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Store Hub for Mobile */}
                <StoreHeroCard
                  bannerUrl={bannerUrl}
                  locations={locations}
                  logoUrl={logoUrl}
                  onOpenAddStore={() => {
                    setMobileMenuOpen(false);
                    setIsAddStoreOpen(true);
                  }}
                  onOpenCardPreview={() => {
                    setMobileMenuOpen(false);
                    setIsCardPreviewOpen(true);
                  }}
                  onSelectStore={(id) => setSelectedLocationId(id)}
                  orgName={orgName}
                  selectedLocationId={selectedLocationId}
                  slug={slug}
                />

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

        {/* Super-Admin Inspection Mode Banner */}
        {isSuperAdmin && (
          <div className="border-b border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs text-purple-900 dark:text-purple-200">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                <span>
                  <strong>Mode Super-Admin :</strong> Vous consultez
                  l&apos;espace de <strong>{orgName}</strong> en mode
                  inspection.
                </span>
              </div>
              <Link
                href="/admin"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-purple-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs transition-colors hover:bg-purple-700"
              >
                ← Retour au Super-Admin
              </Link>
            </div>
          </div>
        )}

        {/* Subscription Status Alert Banner */}
        {subscriptionDetails?.subscription?.status === "grace" && (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>
                    Période de grâce (
                    {subscriptionDetails.graceDaysRemaining ?? 3} jour
                    {(subscriptionDetails.graceDaysRemaining ?? 3) > 1
                      ? "s"
                      : ""}{" "}
                    restant
                    {(subscriptionDetails.graceDaysRemaining ?? 3) > 1
                      ? "s"
                      : ""}
                    ) :
                  </strong>{" "}
                  Vos caisses continuent de fonctionner temporairement.
                  Régularisez votre abonnement pour éviter l&apos;interruption
                  des scans.
                </span>
              </div>
              <Link
                href="/billing"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-amber-700"
              >
                Régulariser mon abonnement
              </Link>
            </div>
          </div>
        )}

        {subscriptionDetails?.subscription?.status === "expired" && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive border-b px-4 py-2.5 text-xs">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Abonnement expiré :</strong> L&apos;ajout de nouveaux
                  clients et les scans sont suspendus. Vos données sont 100%
                  conservées.
                </span>
              </div>
              <Link
                href="/billing"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex shrink-0 items-center justify-center rounded-lg px-3 py-1 text-[11px] font-bold transition-colors"
              >
                Réactiver mon abonnement
              </Link>
            </div>
          </div>
        )}

        {subscriptionDetails?.subscription?.status === "prepaid" && (
          <div className="border-b border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong>Abonnement prépayé &amp; validé !</strong> Votre mois
                  payé démarrera automatiquement dès votre 30ème carte fidélité
                  (actuellement {subscriptionDetails.customerCount}/30 cartes
                  créées).
                </span>
              </div>
              <Link
                href="/billing"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700"
              >
                Voir les détails
              </Link>
            </div>
          </div>
        )}

        {subscriptionDetails?.subscription?.status === "pending" && (
          <div className="border-b border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-xs text-sky-900 dark:text-sky-200">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                <span>
                  <strong>Demande d&apos;abonnement en attente :</strong>{" "}
                  Envoyez votre reçu BaridiMob sur WhatsApp au 0796841801 pour
                  valider votre compte.
                </span>
              </div>
              <Link
                href="/billing"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-sky-600 px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-sky-700"
              >
                Coordonnées de paiement
              </Link>
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
