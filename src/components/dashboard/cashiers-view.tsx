"use client";

import {
  Check,
  Copy,
  Loader2,
  Plus,
  QrCode,
  ScanLine,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import {
  createCashierAction,
  deleteCashierAction,
  getCashiersDataAction,
} from "@/app/actions/cashier";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CashierItem, CashierLeaderboardStats } from "@/dal/cashier";
import { cn } from "@/lib/utils";

interface CashiersViewProps {
  initialCashiers: CashierItem[];
  initialStats: CashierLeaderboardStats[];
  locale?: string;
  program: {
    brandColor: string;
    rewardLabel: string;
    stampsRequired: number;
    type: "points" | "stamps";
  } | null;
}

const formatRelativeTime = (date: Date | null): string => {
  if (!date) {
    return "En attente d'activation";
  }
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSec < 60) {
    return "Dernière utilisation à l'instant";
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `Dernière utilisation il y a ${diffMin} minute${diffMin > 1 ? "s" : ""}`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `Dernière utilisation il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Dernière utilisation il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
};

const renderRankBadge = (rank: number) => {
  if (rank === 1) {
    return <span className="text-amber-500">🏆</span>;
  }
  if (rank === 2) {
    return <span className="text-zinc-400">🥈</span>;
  }
  if (rank === 3) {
    return <span className="text-amber-700">🥉</span>;
  }
  return <span className="text-muted-foreground font-semibold">#{rank}</span>;
};

export const CashiersView = ({
  initialCashiers,
  initialStats,
  locale: _locale,
  program,
}: CashiersViewProps) => {
  const [cashiersList, setCashiersList] =
    useState<CashierItem[]>(initialCashiers);
  const [statsList, setStatsList] =
    useState<CashierLeaderboardStats[]>(initialStats);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "7d" | "30d" | "all" | "custom"
  >("30d");
  const [customDate, setCustomDate] = useState("");
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);

  // New cashier creation state
  const [newCashierName, setNewCashierName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Pairing Modal state
  const [pairingCashier, setPairingCashier] = useState<CashierItem | null>(
    null
  );
  const [pairingQrDataUrl, setPairingQrDataUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  // Deletion state
  const [deletingCashierId, setDeletingCashierId] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Period reload
  const handlePeriodChange = async (
    period: "7d" | "30d" | "all" | "custom",
    dateStr?: string
  ) => {
    setSelectedPeriod(period);
    setIsLoadingPeriod(true);

    const queryPeriod = period === "custom" ? dateStr || customDate : period;
    const res = await getCashiersDataAction(queryPeriod);
    if (res) {
      setCashiersList(res.cashiers);
      setStatsList(res.stats);
    }
    setIsLoadingPeriod(false);
  };

  // Generate QR for pairing modal
  useEffect(() => {
    let isMounted = true;
    if (pairingCashier) {
      const host =
        typeof window === "undefined"
          ? "https://walaa.app"
          : window.location.origin;
      const pairingUrl = `${host}/caisse?code=${pairingCashier.code}`;

      const generateQr = async () => {
        try {
          const url = await QRCode.toDataURL(pairingUrl, {
            margin: 1,
            scale: 8,
            width: 240,
          });
          if (isMounted) {
            setPairingQrDataUrl(url);
          }
        } catch (error) {
          console.error("Error generating QR:", error);
        }
      };
      void generateQr();
    }

    return () => {
      isMounted = false;
    };
  }, [pairingCashier]);

  // Handle Create Cashier
  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCashierName.trim();
    if (!trimmed) {
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    const res = await createCashierAction(trimmed);
    if (res.success && res.cashier) {
      const created = res.cashier;
      setCashiersList((prev) => [created, ...prev]);
      setStatsList((prev) => [
        {
          avis: 0,
          ca: 0,
          cartes: 0,
          cashierId: created.id,
          code: created.code,
          createdAt: created.createdAt,
          lastActiveAt: null,
          name: created.name,
          points: 0,
          rank: prev.length + 1,
          scans: 0,
          token: created.token,
        },
        ...prev,
      ]);
      setNewCashierName("");
      // Automatically open pairing view for the newly created cashier
      setPairingCashier(created);
    } else {
      setCreateError(
        res.error || "Une erreur est survenue lors de la création de la caisse."
      );
    }
    setIsCreating(false);
  };

  // Handle Delete Cashier
  const handleDeleteCashier = async (cashierId: string) => {
    setIsDeleting(true);
    const res = await deleteCashierAction(cashierId);
    if (res.success) {
      setCashiersList((prev) => prev.filter((c) => c.id !== cashierId));
      setStatsList((prev) => prev.filter((s) => s.cashierId !== cashierId));
      if (pairingCashier?.id === cashierId) {
        setPairingCashier(null);
      }
      setDeletingCashierId(null);
    }
    setIsDeleting(false);
  };

  // Handle Copy Link
  const handleCopyLink = () => {
    if (!pairingCashier) {
      return;
    }
    const host =
      typeof window === "undefined"
        ? "https://walaa.app"
        : window.location.origin;
    const pairingUrl = `${host}/caisse?code=${pairingCashier.code}`;

    navigator.clipboard.writeText(pairingUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const isPoints = program?.type === "points";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-border bg-card inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 shadow-xs">
            <ScanLine className="text-foreground h-4 w-4" />
            <span className="text-foreground text-xs font-bold tracking-wide italic">
              Caisses employé
            </span>
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Donnez à chaque employé un accès limité au scan et à
          l&apos;encaissement. Il ne verra ni votre chiffre d&apos;affaires, ni
          vos clients, ni vos réglages, et vous pouvez lui retirer l&apos;accès
          à tout moment.
        </p>
      </div>

      {/* =========================================================================
          PAIRING BANNER / MODAL (Appears when cashier is created or "Appairer" clicked)
          ========================================================================= */}
      {pairingCashier && (
        <Card className="border-border bg-card relative overflow-hidden shadow-md">
          <button
            type="button"
            onClick={() => setPairingCashier(null)}
            aria-label="Fermer"
            className="hover:bg-muted text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-lg p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <CardHeader className="border-border border-b pb-4">
            <CardTitle className="text-base font-bold">
              Activer la caisse de {pairingCashier.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
              {/* Left Column: Instructions */}
              <div className="space-y-4 md:col-span-6">
                <ol className="text-foreground/90 space-y-2.5 text-xs leading-relaxed font-semibold">
                  <li className="flex items-start gap-2">
                    <span className="bg-muted text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                      1
                    </span>
                    <span>
                      Sur le téléphone de la caisse, ouvrez{" "}
                      <strong className="text-foreground font-bold">
                        /caisse
                      </strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-muted text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                      2
                    </span>
                    <span>Ajoutez la page à l&apos;écran d&apos;accueil</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-muted text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                      3
                    </span>
                    <span>Ouvrez l&apos;application ainsi créée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-muted text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                      4
                    </span>
                    <span>Scannez ce code, ou saisissez-le</span>
                  </li>
                </ol>

                {/* Big 6-Digit Code */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-foreground font-mono text-3xl font-black tracking-[0.35em] sm:text-4xl">
                    {pairingCashier.code.split("").join(" ")}
                  </div>
                  <p className="text-muted-foreground text-xs font-medium">
                    Code d&apos;accès à 6 chiffres
                  </p>
                </div>

                {/* Copy Link Button */}
                <div className="space-y-2 pt-1">
                  <Button
                    type="button"
                    onClick={handleCopyLink}
                    className="h-10 w-full bg-zinc-950 text-xs font-bold text-white shadow-xs hover:bg-zinc-900 sm:w-auto"
                  >
                    {isCopied ? (
                      <>
                        <Check className="mr-1.5 h-4 w-4 text-emerald-400" />
                        <span>Lien copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-4 w-4" />
                        <span>Copier le lien à envoyer</span>
                      </>
                    )}
                  </Button>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Envoyez ce lien à l&apos;employé s&apos;il ne peut pas
                    scanner : il s&apos;appaire tout seul en l&apos;ouvrant.
                  </p>
                </div>
              </div>

              {/* Right Column: QR Code */}
              <div className="flex flex-col items-center justify-center md:col-span-6">
                <div className="border-border rounded-2xl border bg-white p-4 shadow-sm">
                  {pairingQrDataUrl ? (
                    <Image
                      src={pairingQrDataUrl}
                      alt="QR Code d'activation caisse"
                      width={200}
                      height={200}
                      className="h-48 w-48 rounded-lg"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center">
                      <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPairingCashier(null)}
                  className="text-muted-foreground hover:text-foreground mt-3 text-xs font-semibold underline underline-offset-4 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          1. NOUVELLE CAISSE CARD
          ========================================================================= */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Plus className="h-4 w-4" />
            <span>Nouvelle caisse</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateCashier} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="newCashierName"
                className="text-foreground text-xs font-bold"
              >
                Prénom de l&apos;employé
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  id="newCashierName"
                  value={newCashierName}
                  onChange={(e) => setNewCashierName(e.target.value)}
                  placeholder="Youssef"
                  className="h-11 flex-1 text-sm font-medium"
                  required
                />
                <Button
                  type="submit"
                  disabled={isCreating || !newCashierName.trim()}
                  className="h-11 bg-red-600 px-6 font-bold text-white shadow-xs hover:bg-red-700"
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ScanLine className="mr-2 h-4 w-4" />
                  )}
                  <span>Créer</span>
                </Button>
              </div>
            </div>

            {createError && (
              <p className="text-destructive text-xs font-semibold">
                {createError}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* =========================================================================
          2. CLASSEMENT DE L'ÉQUIPE (Leaderboard)
          ========================================================================= */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base font-bold">
                Classement de l&apos;équipe
              </CardTitle>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePeriodChange("7d")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  selectedPeriod === "7d"
                    ? "bg-foreground text-background shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground border"
                )}
              >
                7 jours
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange("30d")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  selectedPeriod === "30d"
                    ? "bg-foreground text-background shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground border"
                )}
              >
                30 jours
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange("all")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  selectedPeriod === "all"
                    ? "bg-foreground text-background shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground border"
                )}
              >
                Depuis le début
              </button>
              <div className="relative inline-flex items-center">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    if (e.target.value) {
                      handlePeriodChange("custom", e.target.value);
                    }
                  }}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                    selectedPeriod === "custom"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {(() => {
            if (isLoadingPeriod) {
              return (
                <div className="flex min-h-[160px] items-center justify-center">
                  <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                </div>
              );
            }

            if (statsList.every((s) => s.scans === 0 && s.cartes === 0)) {
              return (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground text-xs font-semibold">
                    Aucune activité sur cette période.
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Le classement se remplit dès qu&apos;un caissier fait créer
                    une carte ou scanne un client.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-border text-muted-foreground border-b font-bold tracking-wider uppercase">
                        <th className="pb-3 pl-2">#</th>
                        <th className="pb-3">Caissier</th>
                        <th className="pb-3 text-center">🪪 Cartes</th>
                        <th className="pb-3 text-center">Scans</th>
                        <th className="pb-3 text-center">
                          {isPoints ? "Points" : "Tampons"}
                        </th>
                        <th className="pb-3 text-center">💸 CA</th>
                        <th className="pr-2 pb-3 text-center">⭐ Avis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                      {statsList.map((row) => (
                        <tr
                          key={row.cashierId}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-3.5 pl-2 font-bold">
                            {renderRankBadge(row.rank)}
                          </td>
                          <td className="text-foreground py-3.5 font-bold">
                            {row.name}
                          </td>
                          <td className="py-3.5 text-center font-bold text-red-600">
                            {row.cartes}
                          </td>
                          <td className="text-foreground py-3.5 text-center font-semibold">
                            {row.scans}
                          </td>
                          <td className="text-foreground py-3.5 text-center font-semibold">
                            {row.points}
                          </td>
                          <td className="text-foreground py-3.5 text-center font-semibold">
                            {row.ca} DA
                          </td>
                          <td className="text-muted-foreground py-3.5 pr-2 text-center font-semibold">
                            {row.avis}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-muted-foreground text-xs leading-relaxed">
                  Touchez une ligne pour voir le détail de ses opérations. Les{" "}
                  <strong className="text-foreground font-bold">cartes</strong>{" "}
                  comptent les clients qui ont désigné ce caissier sur la page
                  d&apos;inscription. C&apos;est le geste qui installe Walaa
                  dans votre commerce &mdash; et celui qui mérite d&apos;être
                  récompensé.
                </p>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* =========================================================================
          3. CAISSES ACTIVES CARD
          ========================================================================= */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <CardTitle className="text-base font-bold">Caisses actives</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {cashiersList.length === 0 ? (
            <p className="text-muted-foreground text-xs font-medium">
              Aucune caisse pour l&apos;instant. Vous continuez à encaisser
              normalement depuis votre propre compte.
            </p>
          ) : (
            <div className="space-y-3">
              {cashiersList.map((cashier) => (
                <div
                  key={cashier.id}
                  className="border-border bg-card/60 flex flex-col gap-3 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="bg-muted text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <ScanLine className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-foreground text-sm font-bold">
                        {cashier.name}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                        <span>⏱</span>
                        <span>{formatRelativeTime(cashier.lastActiveAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPairingCashier(cashier)}
                      className="border-border bg-card hover:bg-muted text-foreground h-9 gap-1.5 rounded-xl text-xs font-semibold shadow-xs"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Appairer</span>
                    </Button>

                    {deletingCashierId === cashier.id ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => handleDeleteCashier(cashier.id)}
                          className="h-9 rounded-xl text-xs font-bold"
                        >
                          {isDeleting ? "..." : "Confirmer"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingCashierId(null)}
                          className="h-9 rounded-xl text-xs font-semibold"
                        >
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingCashierId(cashier.id)}
                        className="text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 h-9 gap-1.5 rounded-xl border-dashed text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Retirer</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
