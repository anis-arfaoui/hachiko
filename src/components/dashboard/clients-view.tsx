"use client";

import {
  ArrowUpDown,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Gift,
  MessageCircle,
  Phone,
  QrCode,
  Search,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MerchantClientItem } from "@/dal/customer";
import { cn } from "@/lib/utils";

interface ClientsViewProps {
  initialClients: MerchantClientItem[];
  locale: string;
  program: {
    brandColor: string;
    id: string;
    rewardLabel: string;
    stampsRequired: number;
    type: "points" | "stamps";
  } | null;
  stats: {
    activeClients: number;
    newClients: number;
    rewardReadyClients: number;
    totalClients: number;
    totalRedeemed: number;
    vipClients: number;
  };
}

type StatusFilter =
  | "all"
  | "reward_ready"
  | "vip"
  | "active"
  | "inactive"
  | "new";
type SortOption = "recent" | "balance_desc" | "visits_desc" | "name_asc";

const formatAlgerianPhone = (phone: string): string => {
  const clean = phone.replaceAll(/\D/gu, "");
  if (clean.length === 10 && clean.startsWith("0")) {
    return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`;
  }
  return phone;
};

const getWhatsAppUrl = (phone: string, clientName: string, cardUrl: string) => {
  const clean = phone.replaceAll(/\D/gu, "");
  let intlPhone = clean;
  if (clean.startsWith("0") && clean.length === 10) {
    intlPhone = `213${clean.slice(1)}`;
  }
  const text = encodeURIComponent(
    `Bonjour ${clientName} ! Voici le lien de votre carte de fidélité : ${cardUrl}`
  );
  return `https://wa.me/${intlPhone}?text=${text}`;
};

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const d = new Date(date);
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return "Aujourd'hui";
  }
  if (diffDays === 1) {
    return "Hier";
  }
  if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  }
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/u);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "CL";
};

export const ClientsView = ({
  initialClients,
  locale,
  program,
  stats,
}: ClientsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [selectedClient, setSelectedClient] =
    useState<MerchantClientItem | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const isPointsProgram = program?.type === "points";
  const targetRequired = program?.stampsRequired ?? 10;
  const rewardLabel = program?.rewardLabel ?? "1 Récompense offerte";

  const handleCopyLink = async (token: string) => {
    if (typeof window === "undefined") {
      return;
    }
    const cardUrl = `${window.location.origin}/${locale}/c/${token}`;
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopiedToken(token);
      setTimeout(() => {
        setCopiedToken(null);
      }, 2000);
    } catch {
      // ignore
    }
  };

  // Filter & Sort clients
  const filteredClients = useMemo(() => {
    let result = [...initialClients];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          (c.code && c.code.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === "balance_desc") {
        return b.balance - a.balance;
      }
      if (sortOption === "visits_desc") {
        return b.totalVisits - a.totalVisits;
      }
      if (sortOption === "name_asc") {
        return a.name.localeCompare(b.name, "fr");
      }
      // default: recent
      return (
        new Date(b.lastVisitAt).getTime() - new Date(a.lastVisitAt).getTime()
      );
    });

    return result;
  }, [initialClients, statusFilter, searchQuery, sortOption]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-foreground text-3xl font-black tracking-tight uppercase">
              Clients
            </h1>
            <span className="border-border bg-card text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-xs">
              <Users className="h-3.5 w-3.5" />
              <span>{stats.totalClients} inscrits</span>
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Consultez tous vos clients, suivez leur progression et gérez leurs
            cartes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/dashboard/qrcode`}
            className="border-border bg-card hover:bg-muted text-foreground inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
          >
            <QrCode className="h-4 w-4" />
            <span>QR Code d&apos;inscription</span>
          </Link>
          <Link
            href={`/${locale}/till`}
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Scanner en caisse</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Clients */}
        <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              Total Clients
            </span>
            <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-foreground mt-2 text-2xl font-black">
            {stats.totalClients}
          </div>
          <div className="text-muted-foreground mt-0.5 text-[11px]">
            {stats.newClients} nouveau{stats.newClients > 1 ? "x" : ""} ce mois
          </div>
        </div>

        {/* Récompense prête */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Récompense Prête
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Gift className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.rewardReadyClients}
          </div>
          <div className="text-muted-foreground mt-0.5 text-[11px]">
            Objectif atteint 🎉
          </div>
        </div>

        {/* Clients Actifs */}
        <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              Clients Actifs (30j)
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-foreground mt-2 text-2xl font-black">
            {stats.activeClients}
          </div>
          <div className="text-muted-foreground mt-0.5 text-[11px]">
            {stats.vipClients} clients VIP (5+ visites)
          </div>
        </div>

        {/* Récompenses offertes */}
        <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              Cadeaux Donnés
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trophy className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-foreground mt-2 text-2xl font-black">
            {stats.totalRedeemed}
          </div>
          <div className="text-muted-foreground mt-0.5 text-[11px]">
            Récompenses distribuées
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="border-border bg-card space-y-3 rounded-2xl border p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, téléphone (ex: 0550...) ou code (ex: C-XXXXXX)..."
              className="h-10 pl-10 text-xs font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-1"
                aria-label="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="border-border bg-background text-foreground h-10 cursor-pointer rounded-xl border px-3 text-xs font-semibold shadow-2xs outline-hidden"
            >
              <option value="recent">Passages récents</option>
              <option value="balance_desc">Solde le plus élevé</option>
              <option value="visits_desc">Nombre de visites</option>
              <option value="name_asc">Nom alphabétique (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="-mx-2 flex items-center gap-1.5 overflow-x-auto px-2 pt-1 pb-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 font-semibold transition-all",
              statusFilter === "all"
                ? "bg-foreground text-background shadow-xs"
                : "border-border bg-muted/40 text-muted-foreground hover:text-foreground border"
            )}
          >
            Tous ({stats.totalClients})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("reward_ready")}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-3 py-1 font-semibold transition-all",
              statusFilter === "reward_ready"
                ? "bg-emerald-600 text-white shadow-xs"
                : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            )}
          >
            <span>🎁 Prêt à offrir</span>
            <span className="ml-1 text-[10px] font-bold">
              ({stats.rewardReadyClients})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("vip")}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-3 py-1 font-semibold transition-all",
              statusFilter === "vip"
                ? "bg-amber-500 text-white shadow-xs"
                : "border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            )}
          >
            <span>⭐ VIP / Fidèles</span>
            <span className="ml-1 text-[10px] font-bold">
              ({stats.vipClients})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-3 py-1 font-semibold transition-all",
              statusFilter === "active"
                ? "bg-foreground text-background shadow-xs"
                : "border-border bg-muted/40 text-muted-foreground hover:text-foreground border"
            )}
          >
            <span>🟢 Actifs</span>
            <span className="ml-1 text-[10px] font-bold">
              ({stats.activeClients})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("new")}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-3 py-1 font-semibold transition-all",
              statusFilter === "new"
                ? "bg-foreground text-background shadow-xs"
                : "border-border bg-muted/40 text-muted-foreground hover:text-foreground border"
            )}
          >
            <span>🆕 Nouveaux</span>
            <span className="ml-1 text-[10px] font-bold">
              ({stats.newClients})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-3 py-1 font-semibold transition-all",
              statusFilter === "inactive"
                ? "bg-foreground text-background shadow-xs"
                : "border-border bg-muted/40 text-muted-foreground hover:text-foreground border"
            )}
          >
            <span>⏳ Inactifs (+30j)</span>
            <span className="ml-1 text-[10px] font-bold">
              (
              {stats.totalClients -
                (stats.activeClients +
                  stats.rewardReadyClients +
                  stats.vipClients +
                  stats.newClients)}
              )
            </span>
          </button>
        </div>
      </div>

      {/* 4. Clients Table / List */}
      <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-xs">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-muted text-muted-foreground mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-foreground text-sm font-bold">
              Aucun client trouvé
            </h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-xs">
              {searchQuery || statusFilter !== "all"
                ? "Aucun client ne correspond à vos critères de recherche. Essayez d'effacer les filtres."
                : "Vous n'avez pas encore de clients enregistrés. Invitez vos clients à scanner votre QR code pour rejoindre votre programme !"}
            </p>
            {searchQuery || statusFilter !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-4 text-xs font-semibold"
              >
                Réinitialiser les filtres
              </Button>
            ) : (
              <Link
                href={`/${locale}/dashboard/qrcode`}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-xs"
              >
                <QrCode className="h-4 w-4" />
                <span>Afficher le QR code client</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-border bg-muted/30 text-muted-foreground border-b font-semibold tracking-wider uppercase">
                  <th scope="col" className="px-5 py-3.5">
                    Client & Code
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Téléphone
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    {isPointsProgram ? "Solde Points" : "Tampons"}
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Activité & Visites
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Statut
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {filteredClients.map((client) => {
                  const progressPct = Math.min(
                    100,
                    Math.round((client.balance / targetRequired) * 100)
                  );
                  const isReady = client.isRewardReady;

                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      {/* 1. Client Identity */}
                      <td className="px-5 py-3.5" aria-label={client.name}>
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold">
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <div className="text-foreground flex items-center gap-2 font-bold">
                              <span>{client.name}</span>
                              {client.status === "vip" && (
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              {client.code ? (
                                <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold">
                                  {client.code}
                                </span>
                              ) : null}
                              <span className="text-muted-foreground text-[10px]">
                                Inscrit {getRelativeTime(client.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact Phone */}
                      <td className="px-5 py-3.5" aria-label={client.phone}>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-mono font-medium">
                            {formatAlgerianPhone(client.phone)}
                          </span>
                          <a
                            href={`tel:${client.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Appeler ${client.name}`}
                            title="Appeler le client"
                            className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                        </div>
                      </td>

                      {/* 3. Loyalty Balance / Progress */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-black tracking-tight",
                                isReady
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-foreground"
                              )}
                            >
                              {client.balance} / {targetRequired}{" "}
                              {isPointsProgram ? "pts" : "tampons"}
                            </span>
                            {isReady && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <Gift className="h-3 w-3" />
                                <span>Débloquée !</span>
                              </span>
                            )}
                          </div>

                          {/* Visual progress bar */}
                          <div className="bg-muted h-1.5 w-32 overflow-hidden rounded-full">
                            <div
                              className={cn(
                                "h-full rounded-full transition-[width]",
                                isReady ? "bg-emerald-500" : "bg-primary"
                              )}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 4. Visits & Activity */}
                      <td
                        className="px-5 py-3.5"
                        aria-label={`${client.totalVisits} visites`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-foreground font-semibold">
                            {client.totalVisits} passage
                            {client.totalVisits > 1 ? "s" : ""}
                            {isPointsProgram && client.totalSpendDA > 0 ? (
                              <span className="text-muted-foreground ml-1.5 font-normal">
                                ({client.totalSpendDA.toLocaleString("fr-FR")}{" "}
                                DA)
                              </span>
                            ) : null}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                            <Clock className="h-3 w-3" />
                            <span>
                              Dernier : {getRelativeTime(client.lastVisitAt)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Status Badge */}
                      <td className="px-5 py-3.5">
                        {client.status === "reward_ready" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            <Gift className="h-3 w-3" />
                            <span>Prêt à offrir</span>
                          </span>
                        )}
                        {client.status === "vip" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                            <Star className="h-3 w-3 fill-amber-500" />
                            <span>Client VIP</span>
                          </span>
                        )}
                        {client.status === "active" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                            <span>Actif</span>
                          </span>
                        )}
                        {client.status === "new" && (
                          <span className="border-border bg-muted text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold">
                            <span>Nouveau</span>
                          </span>
                        )}
                        {client.status === "inactive" && (
                          <span className="border-destructive/30 bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold">
                            <span>Inactif (+30j)</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Quick Action Buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {client.cardToken && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyLink(client.cardToken ?? "");
                                }}
                                aria-label="Copier le lien de la carte du client"
                                title="Copier le lien de la carte du client"
                                className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border p-1.5 transition-colors"
                              >
                                {copiedToken === client.cardToken ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>

                              <a
                                href={`/${locale}/c/${client.cardToken}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Voir la carte client"
                                title="Voir la carte client"
                                className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border p-1.5 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(client);
                            }}
                            className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors"
                          >
                            Détails
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Detailed Client Drawer / Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Fermer la vue détaillée"
            onClick={() => setSelectedClient(null)}
            className="bg-background/80 fixed inset-0 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Card */}
          <div className="border-border bg-card relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black">
                  {getInitials(selectedClient.name)}
                </div>
                <div>
                  <h2 className="text-foreground text-lg font-bold">
                    {selectedClient.name}
                  </h2>
                  <div className="mt-0.5 flex items-center gap-2">
                    {selectedClient.code ? (
                      <span className="bg-muted text-foreground rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                        {selectedClient.code}
                      </span>
                    ) : null}
                    <span className="text-muted-foreground text-xs">
                      {formatAlgerianPhone(selectedClient.phone)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Loyalty Status Bar */}
            <div className="mt-5 space-y-4">
              <div className="border-border bg-muted/30 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium">
                    {isPointsProgram ? "Solde de points" : "Tampons collectés"}
                  </span>
                  <span className="text-foreground font-black">
                    {selectedClient.balance} / {targetRequired}{" "}
                    {isPointsProgram ? "points" : "tampons"}
                  </span>
                </div>

                <div className="bg-muted mt-2.5 h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width]",
                      selectedClient.isRewardReady
                        ? "bg-emerald-500"
                        : "bg-primary"
                    )}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (selectedClient.balance / targetRequired) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>

                {selectedClient.isRewardReady ? (
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Gift className="h-4 w-4" />
                    <span>Récompense débloquée : {rewardLabel}</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-2 text-[11px]">
                    Encore{" "}
                    <span className="text-foreground font-bold">
                      {targetRequired - selectedClient.balance}
                    </span>{" "}
                    {isPointsProgram ? "points" : "tampons"} pour atteindre :{" "}
                    <span className="text-foreground font-medium">
                      {rewardLabel}
                    </span>
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="border-border bg-card rounded-xl border p-3">
                  <div className="text-muted-foreground text-[10px]">
                    Passages
                  </div>
                  <div className="text-foreground mt-1 text-base font-black">
                    {selectedClient.totalVisits}
                  </div>
                </div>
                <div className="border-border bg-card rounded-xl border p-3">
                  <div className="text-muted-foreground text-[10px]">
                    {isPointsProgram ? "Total Dépenses" : "Cadeaux Obtenus"}
                  </div>
                  <div className="text-foreground mt-1 text-base font-black">
                    {isPointsProgram
                      ? `${selectedClient.totalSpendDA.toLocaleString("fr-FR")} DA`
                      : selectedClient.totalRedemptions}
                  </div>
                </div>
                <div className="border-border bg-card rounded-xl border p-3">
                  <div className="text-muted-foreground text-[10px]">
                    Dernière Visite
                  </div>
                  <div className="text-foreground mt-1 text-xs font-bold">
                    {getRelativeTime(selectedClient.lastVisitAt)}
                  </div>
                </div>
              </div>

              {/* Action Buttons: WhatsApp & Card Link */}
              {selectedClient.cardToken && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyLink(selectedClient.cardToken ?? "")
                      }
                      className="border-border bg-card hover:bg-muted text-foreground flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold shadow-xs transition-colors"
                    >
                      {copiedToken === selectedClient.cardToken ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span>Lien copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copier le lien de la carte</span>
                        </>
                      )}
                    </button>

                    <a
                      href={getWhatsAppUrl(
                        selectedClient.phone,
                        selectedClient.name,
                        typeof window === "undefined"
                          ? ""
                          : `${window.location.origin}/${locale}/c/${selectedClient.cardToken}`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-500"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <a
                    href={`/${locale}/c/${selectedClient.cardToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 py-1.5 text-center text-xs font-medium transition-colors"
                  >
                    <span>Ouvrir la carte fidélité dans un nouvel onglet</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Recent Transactions History */}
              <div className="space-y-2 border-t pt-3">
                <span className="text-foreground block text-xs font-bold">
                  Historique récent
                </span>
                {selectedClient.recentTransactions.length === 0 ? (
                  <p className="text-muted-foreground py-2 text-center text-xs">
                    Aucune transaction enregistrée pour ce client.
                  </p>
                ) : (
                  <div className="divide-border max-h-40 divide-y overflow-y-auto text-xs">
                    {selectedClient.recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold",
                              tx.type === "reset"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {tx.type === "reset" ? "🎁" : "⚡"}
                          </span>
                          <div>
                            <span className="text-foreground font-semibold">
                              {tx.type === "reset"
                                ? "Récompense utilisée"
                                : `+${tx.amount} ${isPointsProgram ? "points" : "tampon"}`}
                            </span>
                            {tx.spendAmount ? (
                              <span className="text-muted-foreground ml-1.5">
                                ({tx.spendAmount} DA)
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <span className="text-muted-foreground text-[10px]">
                          {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
