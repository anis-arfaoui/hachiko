"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Clock,
  CreditCard,
  ExternalLink,
  Flame,
  Loader2,
  MapPin,
  Phone,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Store,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  adminApproveStoreAction,
  adminApproveSubscriptionAction,
  adminManualEditSubscriptionAction,
  adminSwitchOrgAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  AdminOrganizationItem,
  AdminPendingStore,
  AdminPendingSubscription,
  AdminStats,
} from "@/dal/admin";
import type { SubscriptionStatus } from "@/dal/subscription";
import { cn } from "@/lib/utils";

interface AdminDashboardViewProps {
  adminUser: {
    email: string;
    id: string;
    name: string;
  };
  initialOrganizations: AdminOrganizationItem[];
  initialPendingStores: AdminPendingStore[];
  initialPendingSubscriptions: AdminPendingSubscription[];
  initialStats: AdminStats;
  locale?: string;
}

const renderStatusBadge = (
  status: SubscriptionStatus,
  expiresAt?: string | null,
  graceDaysRemaining?: number
) => {
  if (status === "active") {
    const expDate = expiresAt
      ? new Date(expiresAt).toLocaleDateString("fr-FR")
      : "N/A";
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
        <Check className="h-2.5 w-2.5" />
        Actif (jusqu&apos;au {expDate})
      </span>
    );
  }
  if (status === "prepaid") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-300">
        <Sparkles className="h-2.5 w-2.5" />
        Prépayé (départ carte 30)
      </span>
    );
  }
  if (status === "grace") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
        <AlertTriangle className="h-2.5 w-2.5" />
        Grâce ({graceDaysRemaining ?? 3}j restants)
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400">
        <Clock className="h-2.5 w-2.5" />
        En attente BaridiMob
      </span>
    );
  }
  if (status === "trial") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
        <Sparkles className="h-2.5 w-2.5" />
        Essai gratuit (&lt; 30)
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
      <AlertCircle className="h-2.5 w-2.5" />
      Expiré
    </span>
  );
};

export const AdminDashboardView = ({
  adminUser,
  initialOrganizations,
  initialPendingStores,
  initialPendingSubscriptions,
  initialStats,
  locale = "fr",
}: AdminDashboardViewProps) => {
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [pendingStores, setPendingStores] =
    useState<AdminPendingStore[]>(initialPendingStores);
  const [pendingSubscriptions, setPendingSubscriptions] = useState<
    AdminPendingSubscription[]
  >(initialPendingSubscriptions);
  const [organizations, setOrganizations] =
    useState<AdminOrganizationItem[]>(initialOrganizations);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "prepaid" | "pending" | "grace" | "trial" | "expired"
  >("all");

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Manual Edit Modal State
  const [editingOrg, setEditingOrg] = useState<AdminOrganizationItem | null>(
    null
  );
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>("active");
  const [editPlan, setEditPlan] = useState<"starter" | "pro">("starter");
  const [editPointsOfSale, setEditPointsOfSale] = useState(1);
  const [editAddMonths, setEditAddMonths] = useState<number>(0);
  const [editExactExpiresAt, setEditExactExpiresAt] = useState("");

  // Filter organizations
  const filteredOrganizations = organizations.filter((org) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      org.name.toLowerCase().includes(query) ||
      (org.ownerEmail && org.ownerEmail.toLowerCase().includes(query)) ||
      (org.slug && org.slug.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === "all" || org.subscription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApproveStore = async (storeId: string) => {
    setActionLoadingId(`store-${storeId}`);
    setActionSuccessMsg(null);

    const res = await adminApproveStoreAction(storeId);
    if (res.success) {
      setPendingStores((prev) => prev.filter((s) => s.id !== storeId));
      setStats((prev) => ({
        ...prev,
        pendingLocationsCount: Math.max(0, prev.pendingLocationsCount - 1),
      }));
      setOrganizations((prev) =>
        prev.map((org) => {
          const hasThisStore = org.locations.some((l) => l.id === storeId);
          if (!hasThisStore) {
            return org;
          }
          return {
            ...org,
            locations: org.locations.map((loc) =>
              loc.id === storeId ? { ...loc, status: "active" } : loc
            ),
          };
        })
      );
      setActionSuccessMsg("Boutique activée avec succès !");
    }
    setActionLoadingId(null);
  };

  const handleApproveSubscription = async (organizationId: string) => {
    setActionLoadingId(`approve-sub-${organizationId}`);
    setActionSuccessMsg(null);

    const res = await adminApproveSubscriptionAction(organizationId);
    if (res.success) {
      const pendingItem = pendingSubscriptions.find(
        (p) => p.organizationId === organizationId
      );
      const isPrepaid = (pendingItem?.customerCount ?? 0) < 30;

      setPendingSubscriptions((prev) =>
        prev.filter((p) => p.organizationId !== organizationId)
      );
      setStats((prev) => ({
        ...prev,
        pendingSubscriptionsCount: Math.max(
          0,
          prev.pendingSubscriptionsCount - 1
        ),
      }));

      setOrganizations((prev) =>
        prev.map((org) => {
          if (org.id !== organizationId) {
            return org;
          }
          const now = new Date();
          let durationMonths = 1;
          if (pendingItem?.billingCycle === "semestriel") {
            durationMonths = 6;
          } else if (pendingItem?.billingCycle === "annuel") {
            durationMonths = 12;
          }

          if (isPrepaid) {
            return {
              ...org,
              subscription: {
                ...org.subscription,
                plan: pendingItem?.plan ?? org.subscription.plan,
                prepaidPlan: {
                  billingCycle: (pendingItem?.billingCycle ?? "mensuel") as
                    | "mensuel"
                    | "semestriel"
                    | "annuel",
                  durationMonths,
                  paidAt: now.toISOString(),
                  plan: pendingItem?.plan ?? "starter",
                },
                status: "prepaid" as SubscriptionStatus,
              },
            };
          }

          const base =
            org.subscription.expiresAt &&
            new Date(org.subscription.expiresAt) > now
              ? new Date(org.subscription.expiresAt)
              : now;
          const exp = new Date(base);
          exp.setMonth(exp.getMonth() + durationMonths);

          return {
            ...org,
            subscription: {
              ...org.subscription,
              expiresAt: exp.toISOString(),
              plan: pendingItem?.plan ?? org.subscription.plan,
              status: "active" as SubscriptionStatus,
            },
          };
        })
      );

      setActionSuccessMsg(
        isPrepaid
          ? "Paiement validé ! Compte passé en Prépayé (départ au 30ème client)."
          : "Paiement validé et formule activée avec succès !"
      );
    }
    setActionLoadingId(null);
  };

  const handleQuickAddMonths = async (orgId: string, months: number) => {
    setActionLoadingId(`quick-${orgId}-${months}`);
    setActionSuccessMsg(null);

    const res = await adminManualEditSubscriptionAction(orgId, {
      addMonths: months,
      status: "active",
    });

    if (res.success) {
      setOrganizations((prev) =>
        prev.map((org) => {
          if (org.id !== orgId) {
            return org;
          }
          const now = new Date();
          const base =
            org.subscription.expiresAt &&
            new Date(org.subscription.expiresAt) > now
              ? new Date(org.subscription.expiresAt)
              : now;
          const exp = new Date(base);
          exp.setMonth(exp.getMonth() + months);

          return {
            ...org,
            subscription: {
              ...org.subscription,
              expiresAt: exp.toISOString(),
              status: "active",
            },
          };
        })
      );
      setActionSuccessMsg(
        `Abonnement prolongé de +${months} mois avec succès !`
      );
    }
    setActionLoadingId(null);
  };

  const handleOpenEditModal = (org: AdminOrganizationItem) => {
    setEditingOrg(org);
    setEditStatus(org.subscription.status);
    setEditPlan(org.subscription.plan || "starter");
    setEditPointsOfSale(org.subscription.pointsOfSale || 1);
    setEditAddMonths(0);
    setEditExactExpiresAt(
      org.subscription.expiresAt ? org.subscription.expiresAt.split("T")[0] : ""
    );
  };

  const handleSaveManualEdit = async () => {
    if (!editingOrg) {
      return;
    }
    setActionLoadingId(`save-manual-${editingOrg.id}`);
    setActionSuccessMsg(null);

    const res = await adminManualEditSubscriptionAction(editingOrg.id, {
      addMonths: editAddMonths > 0 ? editAddMonths : undefined,
      exactExpiresAt: editExactExpiresAt
        ? new Date(editExactExpiresAt).toISOString()
        : undefined,
      plan: editPlan,
      pointsOfSale: editPointsOfSale,
      status: editStatus,
    });

    if (res.success) {
      setOrganizations((prev) =>
        prev.map((org) => {
          if (org.id !== editingOrg.id) {
            return org;
          }
          const now = new Date();
          let newExpiry = org.subscription.expiresAt;
          if (editExactExpiresAt) {
            newExpiry = new Date(editExactExpiresAt).toISOString();
          } else if (editAddMonths > 0) {
            const base =
              newExpiry && new Date(newExpiry) > now
                ? new Date(newExpiry)
                : now;
            const exp = new Date(base);
            exp.setMonth(exp.getMonth() + editAddMonths);
            newExpiry = exp.toISOString();
          }

          return {
            ...org,
            subscription: {
              ...org.subscription,
              expiresAt: newExpiry,
              plan: editPlan,
              pointsOfSale: editPointsOfSale,
              status: editStatus,
            },
          };
        })
      );
      setActionSuccessMsg(
        `Abonnement de "${editingOrg.name}" mis à jour avec succès !`
      );
      setEditingOrg(null);
    }
    setActionLoadingId(null);
  };

  const handleSwitchToOrg = async (orgId: string) => {
    setActionLoadingId(`switch-${orgId}`);
    const res = await adminSwitchOrgAction(orgId);
    if (res.success) {
      router.push(`/${locale}/dashboard`);
    }
    setActionLoadingId(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      {/* Top Bar Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 rounded-xl p-0 text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-black tracking-wider text-purple-400 uppercase">
                <Shield className="h-3 w-3" />
                Super-Admin
              </span>
              <h1 className="text-xl font-black text-white sm:text-2xl">
                Walaa Back-Office
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              Connecté en tant que{" "}
              <strong className="text-zinc-200">{adminUser.email}</strong>
            </p>
          </div>
        </div>

        <Link href={`/${locale}/dashboard`}>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-zinc-800 text-xs text-zinc-300 hover:text-white"
          >
            <Store className="mr-1.5 h-3.5 w-3.5" />
            <span>Retour à mon commerce</span>
          </Button>
        </Link>
      </div>

      {/* Global Success Notification */}
      {actionSuccessMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats KPI Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="rounded-2xl border-zinc-800 bg-zinc-950/80 p-4 shadow-xs">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="flex items-center justify-between text-xs text-zinc-400">
              <span>Total Commerces</span>
              <Building2 className="h-4 w-4 text-purple-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-black text-white">
              {stats.totalOrganizations}
            </div>
            <p className="text-[11px] text-zinc-500">
              {stats.totalLocations} points de vente
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-800 bg-zinc-950/80 p-4 shadow-xs">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="flex items-center justify-between text-xs text-zinc-400">
              <span>Clients Fidélisés</span>
              <Users className="h-4 w-4 text-blue-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-black text-white">
              {stats.totalCustomers}
            </div>
            <p className="text-[11px] text-zinc-500">
              Cartes de fidélité actives
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-800 bg-zinc-950/80 p-4 shadow-xs">
          <CardHeader className="p-0 pb-1">
            <CardTitle className="flex items-center justify-between text-xs text-zinc-400">
              <span>Total Encaissements</span>
              <Flame className="h-4 w-4 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-black text-white">
              {stats.totalTransactions}
            </div>
            <p className="text-[11px] text-zinc-500">
              {stats.totalRedemptions} récompenses offertes
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl border-zinc-800 bg-zinc-950/80 p-4 shadow-xs transition-colors",
            stats.pendingLocationsCount + stats.pendingSubscriptionsCount > 0 &&
              "border-amber-500/40 bg-amber-500/5"
          )}
        >
          <CardHeader className="p-0 pb-1">
            <CardTitle className="flex items-center justify-between text-xs text-zinc-400">
              <span>En attente BaridiMob</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-black text-amber-400">
              {stats.pendingLocationsCount + stats.pendingSubscriptionsCount}
            </div>
            <p className="text-[11px] text-zinc-500">
              {stats.pendingSubscriptionsCount} abonnement(s),{" "}
              {stats.pendingLocationsCount} boutique(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 1. URGENT PENDING SUBSCRIPTIONS SECTION */}
      {pendingSubscriptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            <h2 className="text-sm font-black tracking-wider text-amber-400 uppercase">
              Demandes d&apos;abonnements en attente (
              {pendingSubscriptions.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pendingSubscriptions.map((subItem) => {
              const isLoading =
                actionLoadingId === `approve-sub-${subItem.organizationId}`;
              const waMessage = encodeURIComponent(
                `Bonjour, je vous contacte concernant votre demande d'abonnement pour l'établissement *${subItem.organizationName}* sur Walaa.`
              );
              const waLink = subItem.ownerPhone
                ? `https://wa.me/${subItem.ownerPhone.replaceAll(/\D/gu, "")}?text=${waMessage}`
                : `https://wa.me/213796841801?text=${waMessage}`;

              const willBePrepaid = subItem.customerCount < 30;

              return (
                <div
                  key={subItem.organizationId}
                  className="flex flex-col justify-between rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase">
                          {subItem.organizationSlug
                            ? `/j/${subItem.organizationSlug}`
                            : "Commerce"}
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {subItem.organizationName}
                        </h3>
                      </div>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-400">
                        {subItem.price.toLocaleString("fr-FR")} DA
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-bold text-zinc-300 uppercase">
                        Plan {subItem.plan}
                      </span>
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-300">
                        {subItem.billingCycle}
                      </span>
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-300">
                        {subItem.pointsOfSale} boutique
                        {subItem.pointsOfSale > 1 ? "s" : ""}
                      </span>
                      {subItem.hasNfcPlaque && (
                        <span className="rounded-md bg-purple-500/20 px-2 py-0.5 font-bold text-purple-300">
                          + Plaque NFC
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 text-[11px] text-zinc-400">
                      {subItem.ownerName && (
                        <div>
                          Contact :{" "}
                          <strong className="text-zinc-200">
                            {subItem.ownerName}
                          </strong>
                        </div>
                      )}
                      {subItem.ownerPhone && (
                        <div>
                          Téléphone :{" "}
                          <span className="font-mono text-zinc-200">
                            {subItem.ownerPhone}
                          </span>
                        </div>
                      )}
                      {subItem.ownerEmail && (
                        <div>
                          Email :{" "}
                          <span className="text-zinc-400">
                            {subItem.ownerEmail}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Transition badge */}
                    <div className="pt-1">
                      {willBePrepaid ? (
                        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-2 text-[11px] text-teal-300">
                          <strong>
                            Essai en cours ({subItem.customerCount}/30 cartes) :
                          </strong>{" "}
                          Passera en <strong>Prépayé</strong> (le mois payé
                          commencera au 30ème client).
                        </div>
                      ) : (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-[11px] text-emerald-300">
                          <strong>
                            Essai terminé ({subItem.customerCount} cartes) :
                          </strong>{" "}
                          S&apos;activera immédiatement pour{" "}
                          {subItem.billingCycle}.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-amber-500/20 pt-3">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 hover:text-white"
                    >
                      WhatsApp
                    </a>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleApproveSubscription(subItem.organizationId)
                      }
                      disabled={isLoading}
                      className="gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>Valider le Paiement &amp; Activer</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. PENDING STORES APPROVALS SECTION */}
      {pendingStores.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            <h2 className="text-sm font-black tracking-wider text-amber-400 uppercase">
              Boutiques en attente d&apos;approbation ({pendingStores.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pendingStores.map((pending) => {
              const isLoading = actionLoadingId === `store-${pending.id}`;
              const waMessage = encodeURIComponent(
                `Bonjour, je vous contacte concernant votre demande d'ajout de la boutique *${pending.name}* sur Walaa.`
              );
              const waLink = pending.phone
                ? `https://wa.me/${pending.phone.replaceAll(/\D/gu, "")}?text=${waMessage}`
                : null;

              return (
                <div
                  key={pending.id}
                  className="flex flex-col justify-between rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase">
                          {pending.organizationName}
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {pending.name}
                        </h3>
                      </div>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                        +2 500 DA/m
                      </span>
                    </div>

                    <div className="space-y-0.5 text-zinc-400">
                      {pending.city && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-zinc-500" />
                          <span>{pending.city}</span>
                        </div>
                      )}
                      {pending.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-zinc-500" />
                          <span>{pending.address}</span>
                        </div>
                      )}
                      {pending.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-zinc-500" />
                          <span>{pending.phone}</span>
                        </div>
                      )}
                      {pending.ownerEmail && (
                        <div className="text-[10px] text-zinc-500">
                          Propriétaire : {pending.ownerEmail}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-amber-500/20 pt-3">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 hover:text-white"
                      >
                        Contacter WhatsApp
                      </a>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleApproveStore(pending.id)}
                      disabled={isLoading}
                      className="gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>Valider &amp; Activer</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. DIRECTORY SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black tracking-tight text-white uppercase">
              Annuaire des Commerces ({filteredOrganizations.length})
            </h2>
            <p className="text-xs text-zinc-400">
              Gérez les abonnements, les plans et inspectez chaque compte
              client.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher commerce, email..."
              className="h-9 border-zinc-800 bg-zinc-900 pl-8 text-xs text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-800 pb-2.5 text-xs">
          {(
            [
              { id: "all", label: "Tous les commerces" },
              { id: "active", label: "Abonnés actifs" },
              { id: "prepaid", label: "Prépayés (< 30)" },
              { id: "pending", label: "En attente BaridiMob" },
              { id: "grace", label: "Période de grâce" },
              { id: "trial", label: "Essai gratuit (< 30)" },
              { id: "expired", label: "Expirés" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === tab.id
                  ? "bg-white font-bold text-zinc-950 shadow-xs"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Organizations List */}
        <div className="space-y-3">
          {filteredOrganizations.map((org) => {
            const isLoadingSwitch = actionLoadingId === `switch-${org.id}`;
            const sub = org.subscription;
            const activeLocationsCount = org.locations.filter(
              (l) => l.status === "active"
            ).length;

            return (
              <div
                key={org.id}
                className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-zinc-700 sm:p-5"
              >
                {/* Header row */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {org.name}
                      </h3>
                      {renderStatusBadge(
                        sub.status,
                        sub.expiresAt,
                        org.graceDaysRemaining
                      )}
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300 uppercase">
                        Plan {sub.plan}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                      {org.ownerEmail && (
                        <span>
                          Propriétaire :{" "}
                          <strong className="text-zinc-300">
                            {org.ownerEmail}
                          </strong>
                        </span>
                      )}
                      {org.ownerPhone && (
                        <span>
                          Tél :{" "}
                          <span className="font-mono text-zinc-300">
                            {org.ownerPhone}
                          </span>
                        </span>
                      )}
                      {org.slug && (
                        <span>
                          Lien :{" "}
                          <code className="text-purple-400">/j/{org.slug}</code>
                        </span>
                      )}
                      <span>
                        Inscrit le{" "}
                        {new Date(org.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>

                  {/* Impersonation action */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSwitchToOrg(org.id)}
                    disabled={isLoadingSwitch}
                    className="border-zinc-800 text-xs text-zinc-300 hover:text-white"
                  >
                    {isLoadingSwitch ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-purple-400" />
                    )}
                    <span>Ouvrir son dashboard</span>
                  </Button>
                </div>

                {/* Metrics chips */}
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-900/60 p-3 text-xs sm:grid-cols-4">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase">
                      Boutiques
                    </span>
                    <p className="font-bold text-white">
                      {activeLocationsCount} active
                      {activeLocationsCount > 1 ? "s" : ""} / {sub.pointsOfSale}{" "}
                      autorisée
                      {sub.pointsOfSale > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase">
                      Clients enregistrés
                    </span>
                    <p className="font-bold text-white">
                      {org.customerCount} client
                      {org.customerCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase">
                      Encaissements
                    </span>
                    <p className="font-bold text-white">
                      {org.transactionCount} scan
                      {org.transactionCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase">
                      Tarif &amp; Cycle
                    </span>
                    <p className="font-bold text-white">
                      {sub.price ?? 4900} DA ({sub.billingCycle})
                    </p>
                  </div>
                </div>

                {/* Subscriptions Quick Management Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-900 pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <CreditCard className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[11px] font-semibold">
                      Gestion de l&apos;accès :
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === `quick-${org.id}-1`}
                      onClick={() => handleQuickAddMonths(org.id, 1)}
                      className="h-7 rounded-lg border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      +1 Mois
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === `quick-${org.id}-12`}
                      onClick={() => handleQuickAddMonths(org.id, 12)}
                      className="h-7 rounded-lg border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      +1 An
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditModal(org)}
                      className="h-7 rounded-lg border-purple-500/30 bg-purple-500/10 px-2.5 text-[11px] font-bold text-purple-300 hover:bg-purple-500/20"
                    >
                      <SlidersHorizontal className="mr-1 h-3 w-3" />
                      Gérer l&apos;accès
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredOrganizations.length === 0 && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center text-xs text-zinc-500">
              Aucun commerce trouvé pour ce filtre.
            </div>
          )}
        </div>
      </div>

      {/* 4. MANUAL SUBSCRIPTION MANAGEMENT MODAL */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Gérer l&apos;accès : {editingOrg.name}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {editingOrg.ownerEmail || "Sans propriétaire"} &bull;{" "}
                  {editingOrg.customerCount} clients fidélisés
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrg(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Statut */}
              <div>
                <label
                  htmlFor="edit-status-select"
                  className="text-[11px] font-bold text-zinc-300 uppercase"
                >
                  Statut de l&apos;abonnement
                </label>
                <select
                  id="edit-status-select"
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as SubscriptionStatus)
                  }
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white"
                >
                  <option value="trial">Essai gratuit (&lt; 30 clients)</option>
                  <option value="prepaid">
                    Prépayé (départ au 30ème client)
                  </option>
                  <option value="active">Actif (en cours de validité)</option>
                  <option value="grace">
                    Période de grâce (3 jours avant coupure)
                  </option>
                  <option value="expired">
                    Expiré / Suspendu (scans bloqués)
                  </option>
                  <option value="pending">
                    En attente de paiement BaridiMob
                  </option>
                </select>
              </div>

              {/* Formule & Points of sale */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-plan-select"
                    className="text-[11px] font-bold text-zinc-300 uppercase"
                  >
                    Formule
                  </label>
                  <select
                    id="edit-plan-select"
                    value={editPlan}
                    onChange={(e) =>
                      setEditPlan(e.target.value as "starter" | "pro")
                    }
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white"
                  >
                    <option value="starter">Starter (200 clients max)</option>
                    <option value="pro">Pro (Clients illimités)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-points-of-sale-input"
                    className="text-[11px] font-bold text-zinc-300 uppercase"
                  >
                    Boutiques autorisées
                  </label>
                  <Input
                    id="edit-points-of-sale-input"
                    type="number"
                    min={1}
                    max={20}
                    value={editPointsOfSale}
                    onChange={(e) =>
                      setEditPointsOfSale(Number(e.target.value))
                    }
                    className="mt-1 h-9 border-zinc-800 bg-zinc-900 text-xs text-white"
                  />
                </div>
              </div>

              {/* Date d'expiration exacte */}
              <div>
                <label
                  htmlFor="edit-exact-expires-at-input"
                  className="text-[11px] font-bold text-zinc-300 uppercase"
                >
                  Date d&apos;expiration exacte
                </label>
                <Input
                  id="edit-exact-expires-at-input"
                  type="date"
                  value={editExactExpiresAt}
                  onChange={(e) => {
                    setEditExactExpiresAt(e.target.value);
                    setEditAddMonths(0);
                  }}
                  className="mt-1 h-9 border-zinc-800 bg-zinc-900 text-xs text-white"
                />
              </div>

              {/* Prolongation rapide */}
              <div>
                <span className="text-[11px] font-bold text-zinc-300 uppercase">
                  Ou ajouter des mois au terme actuel
                </span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {[1, 3, 6, 12].map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant={editAddMonths === m ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setEditAddMonths(m);
                        setEditExactExpiresAt("");
                      }}
                      className={cn(
                        "h-8 rounded-xl text-xs font-bold",
                        editAddMonths === m
                          ? "bg-purple-600 text-white"
                          : "border-zinc-800 text-zinc-300 hover:text-white"
                      )}
                    >
                      +{m} Mois
                    </Button>
                  ))}
                  {editAddMonths > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditAddMonths(0)}
                      className="h-8 rounded-xl text-xs text-zinc-500"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingOrg(null)}
                className="rounded-xl border-zinc-800 text-xs text-zinc-400 hover:text-white"
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleSaveManualEdit}
                disabled={actionLoadingId === `save-manual-${editingOrg.id}`}
                className="gap-1.5 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-500"
              >
                {actionLoadingId === `save-manual-${editingOrg.id}` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Enregistrer</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
