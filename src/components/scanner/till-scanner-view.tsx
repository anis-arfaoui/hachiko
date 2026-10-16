"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  Gift,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  TriangleAlert,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import {
  cancelTransactionAction,
  lookupCustomerAction,
  scanRedeemAction,
  scanStampAction,
} from "@/app/actions/customer";
import { CameraView } from "@/components/scanner/camera-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CardDetailsWithCooldown } from "@/dal/card";
import { cn } from "@/lib/utils";

const playSuccessBeep = () => {
  if (typeof window === "undefined" || !("AudioContext" in window)) {
    return;
  }
  try {
    const AudioContextClass = window.AudioContext;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } catch {
    // Audio context may not be allowed until user gesture
  }
};

const triggerHaptic = () => {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
};

type TillStep = "scan" | "preview" | "success";

interface SuccessState {
  addedAmount: number;
  customerCode: string;
  isCanceled?: boolean;
  newBalance: number;
  programType: "stamps" | "points";
  rewardLabel: string;
  stampsRequired: number;
  token: string;
  transactionId: string;
}

interface TillScannerViewProps {
  backHref?: string;
  backLabel?: string;
}

export const TillScannerView = ({
  backHref = "/dashboard",
  backLabel = "Retour",
}: TillScannerViewProps) => {
  // Step state: "scan" -> "preview" -> "success"
  const [currentStep, setCurrentStep] = useState<TillStep>("scan");

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Manual search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Active customer card for Stage 2 (preview)
  const [activeCard, setActiveCard] = useState<CardDetailsWithCooldown | null>(
    null
  );
  const [spendInput, setSpendInput] = useState("");
  const [bypassCooldown, setBypassCooldown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Success state for Stage 3 (confirmation & undo)
  const [successData, setSuccessData] = useState<SuccessState | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  // Reset to initial scan screen
  const handleResetToScan = useCallback(() => {
    setCurrentStep("scan");
    setActiveCard(null);
    setSpendInput("");
    setBypassCooldown(false);
    setActionError(null);
    setLookupError(null);
    setSuccessData(null);
    setCancelFeedback(null);
    setIsCameraActive(true);
  }, []);

  // Customer lookup logic (used by both camera scan and manual search)
  const handleLookup = useCallback(async (identifier: string) => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return;
    }

    setIsSearching(true);
    setLookupError(null);

    try {
      const res = await lookupCustomerAction(trimmed);
      if (!res.success) {
        setLookupError(
          "Aucun client trouvé avec ce code, ce numéro de téléphone ou ce QR code."
        );
        setIsSearching(false);
        return;
      }

      setActiveCard(res.card);
      setSpendInput("");
      setBypassCooldown(false);
      setActionError(null);
      setCurrentStep("preview");
      setIsSearching(false);
    } catch {
      setLookupError("Erreur de connexion. Impossible de trouver le client.");
      setIsSearching(false);
    }
  }, []);

  // Camera QR scan callback
  const handleCameraScan = useCallback(
    async (token: string) => {
      await handleLookup(token);
    },
    [handleLookup]
  );

  const handleScanError = useCallback((err: string) => {
    setCameraError(err);
  }, []);

  const handleResetCameraError = useCallback(() => {
    setCameraError(null);
    setIsCameraActive(true);
  }, []);

  // Manual search submit
  const handleManualSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLookup(searchQuery);
  };

  // Submit stamp or points from Stage 2
  const handleConfirmAdd = async () => {
    if (!activeCard) {
      return;
    }

    const isPoints = activeCard.programType === "points";
    const parsedSpend = Number(spendInput.trim());

    // In points mode, points to add = spend amount in DA
    if (isPoints && (!parsedSpend || parsedSpend <= 0)) {
      setActionError("Veuillez entrer un montant valide supérieur à 0 DA.");
      return;
    }

    const pointsAmount = isPoints ? Math.round(parsedSpend) : 1;
    const spendAmount =
      !Number.isNaN(parsedSpend) && parsedSpend > 0
        ? Math.round(parsedSpend)
        : undefined;

    setIsSubmitting(true);
    setActionError(null);

    try {
      const clientUuid = crypto.randomUUID();
      const res = await scanStampAction({
        amount: pointsAmount,
        clientUuid,
        ignoreCooldown: bypassCooldown,
        spendAmount,
        token: activeCard.token,
      });

      if (!res.success) {
        if (res.error === "COOLDOWN_ACTIVE") {
          setActionError(
            `Ce client a déjà été scanné récemment. Patientez ${res.remainingSeconds}s ou cochez « Continuer quand même » ci-dessous.`
          );
        } else if (res.error === "UNAUTHORIZED_ORGANIZATION") {
          setActionError("Cette carte appartient à un autre commerce.");
        } else {
          setActionError("Erreur lors de la validation. Veuillez réessayer.");
        }
        setIsSubmitting(false);
        return;
      }

      playSuccessBeep();
      triggerHaptic();

      setSuccessData({
        addedAmount: pointsAmount,
        customerCode: activeCard.customerCode,
        newBalance: res.balance,
        programType: isPoints ? "points" : "stamps",
        rewardLabel: activeCard.rewardLabel,
        stampsRequired: activeCard.stampsRequired,
        token: activeCard.token,
        transactionId: res.transactionId,
      });

      setCurrentStep("success");
      setIsSubmitting(false);
    } catch {
      setActionError("Erreur réseau. Impossible de contacter le serveur.");
      setIsSubmitting(false);
    }
  };

  // Redeem reward from Stage 2
  const handleRedeem = async (rewardId?: string) => {
    if (!activeCard) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await scanRedeemAction(activeCard.token, rewardId);
      if (res.success) {
        playSuccessBeep();
        triggerHaptic();
        setActiveCard((prev) =>
          prev ? { ...prev, balance: res.balance } : null
        );
        setActionError(null);
        setCancelFeedback(
          `Récompense « ${res.rewardLabel} » validée avec succès ! Nouveau solde : ${res.balance}`
        );
      } else {
        setActionError("Impossible de valider la récompense pour le moment.");
      }
      setIsSubmitting(false);
    } catch {
      setActionError("Erreur lors de la validation de la récompense.");
      setIsSubmitting(false);
    }
  };

  // Undo transaction from Stage 3
  const handleUndoTransaction = async () => {
    if (!successData?.transactionId || successData.isCanceled) {
      return;
    }

    setIsCanceling(true);

    try {
      const res = await cancelTransactionAction(successData.transactionId);
      if (res.success) {
        setSuccessData((prev) =>
          prev
            ? {
                ...prev,
                isCanceled: true,
                newBalance: res.newBalance,
              }
            : null
        );
        setCancelFeedback("Opération annulée avec succès !");
      } else {
        setCancelFeedback("Impossible d'annuler cette opération.");
      }
      setIsCanceling(false);
    } catch {
      setCancelFeedback("Erreur lors de l'annulation.");
      setIsCanceling(false);
    }
  };

  const renderRewardsSection = () => {
    if (activeCard?.rewards && activeCard.rewards.length > 0) {
      return (
        <div className="space-y-2">
          <div className="text-foreground flex items-center justify-between px-1 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-amber-500" />
              <span>Récompenses disponibles</span>
            </span>
            <span className="text-muted-foreground text-[11px] font-medium">
              {activeCard.balance}{" "}
              {activeCard.programType === "points" ? "pts" : "tampons"}{" "}
              disponibles
            </span>
          </div>

          <div className="space-y-2">
            {activeCard.rewards.map((reward) => {
              const canRedeem = activeCard.balance >= reward.cost;
              return (
                <div
                  key={reward.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 text-xs transition-all",
                    canRedeem
                      ? "border-amber-300 bg-amber-50/80 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200"
                      : "border-border bg-card/60 text-muted-foreground opacity-70"
                  )}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <Gift
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          canRedeem
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                        )}
                      />
                      <span className="truncate">{reward.label}</span>
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-[11px]">
                      Coût : {reward.cost}{" "}
                      {activeCard.programType === "points"
                        ? "points"
                        : "tampons"}
                      {reward.description ? ` • ${reward.description}` : ""}
                    </div>
                  </div>

                  {canRedeem ? (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleRedeem(reward.id)}
                      disabled={isSubmitting}
                      className="h-8 shrink-0 bg-amber-600 font-bold text-white shadow-xs hover:bg-amber-700"
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                      <span>Récompenser (-{reward.cost})</span>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-[11px] font-medium">
                      {reward.cost - activeCard.balance} manquants
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (activeCard?.rewardLabel) {
      return (
        <div className="border-border bg-card flex items-center justify-between rounded-xl border p-3 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-amber-500" />
            <span>{activeCard.rewardLabel}</span>
          </div>

          {activeCard.balance >= activeCard.stampsRequired && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleRedeem()}
              disabled={isSubmitting}
              className="h-8 bg-amber-600 font-bold text-white hover:bg-amber-700"
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              <span>Récompenser</span>
            </Button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 pb-12">
      {/* Back Link */}
      <div>
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{backLabel}</span>
        </Link>
      </div>

      {/* Title Header */}
      <div className="space-y-1 text-center">
        <h1 className="text-foreground text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
          Scanner
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Scannez le QR code du client pour ajouter des points ou tampons.
        </p>
      </div>

      {/* =========================================================================
          STAGE 1: SCAN OR MANUAL SEARCH
          ========================================================================= */}
      {currentStep === "scan" && (
        <div className="space-y-6">
          {/* Camera Viewfinder */}
          <div className="bg-card border-border relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border shadow-lg">
            <CameraView
              error={cameraError}
              isProcessing={isSearching}
              isScanning={isCameraActive}
              onScan={handleCameraScan}
              onScanError={handleScanError}
              onResetError={handleResetCameraError}
            />

            {!isCameraActive && (
              <div className="bg-card/90 absolute inset-0 flex items-center justify-center p-4">
                <Button
                  size="lg"
                  className="w-full max-w-xs font-bold"
                  onClick={() => {
                    setCameraError(null);
                    setIsCameraActive(true);
                  }}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  <span>Activer la caméra</span>
                </Button>
              </div>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div className="border-border bg-card space-y-3 rounded-2xl border p-4 shadow-xs">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
              <Search className="h-3.5 w-3.5" />
              <span>Saisie manuelle ou recherche</span>
            </div>

            <form onSubmit={handleManualSearchSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="Code client C-XXXXXX, n° tél ou lien"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
              <Button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="shrink-0 text-xs font-bold"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Valider"
                )}
              </Button>
            </form>

            {lookupError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 2: CUSTOMER CARD PREVIEW & AMOUNT INPUT
          ========================================================================= */}
      {currentStep === "preview" && activeCard && (
        <div className="space-y-6">
          {/* Card Visual */}
          <div
            className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl transition-all"
            style={{
              backgroundColor: activeCard.brandColor || "#18181b",
            }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 opacity-80" />
                <span className="font-mono text-sm font-bold tracking-wider">
                  {activeCard.customerCode}
                </span>
              </div>
              <p className="text-xs font-medium text-white/80">
                {activeCard.businessName}
              </p>
            </div>

            {activeCard.programType === "points" ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight">
                    {activeCard.balance}
                  </span>
                  <span className="text-sm font-semibold tracking-wider text-white/80 uppercase">
                    points
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (activeCard.balance / (activeCard.stampsRequired || 100)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-white/80">
                    Objectif : {activeCard.stampsRequired} points pour{" "}
                    {activeCard.rewardLabel}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight">
                    {activeCard.balance}
                  </span>
                  <span className="text-sm font-semibold tracking-wider text-white/80 uppercase">
                    / {activeCard.stampsRequired} tampons
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2 pt-1 sm:grid-cols-10">
                  {Array.from({ length: activeCard.stampsRequired }).map(
                    (_, i) => (
                      <div
                        key={`stamp-${i.toString()}`}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-xl border border-white/20 text-xs font-bold transition-all",
                          i < activeCard.balance
                            ? "bg-white text-zinc-950 shadow-xs"
                            : "bg-white/10 text-white/40"
                        )}
                      >
                        {i < activeCard.balance ? "✓" : i + 1}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cooldown warning notice */}
          {activeCard.isCooldownActive && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-2">
                <p>
                  Ce client a déjà reçu des points il y a moins de 3 minutes
                  (reste {activeCard.cooldownRemainingSeconds}s).
                </p>
                <label className="flex cursor-pointer items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    checked={bypassCooldown}
                    onChange={(e) => setBypassCooldown(e.target.checked)}
                    className="accent-primary h-4 w-4 rounded"
                  />
                  <span>Continuer quand même (dérogation)</span>
                </label>
              </div>
            </div>
          )}

          {/* Action error banner */}
          {actionError && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Cancel/Redeem feedback notice */}
          {cancelFeedback && (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{cancelFeedback}</span>
            </div>
          )}

          {/* Available rewards section */}
          {renderRewardsSection()}

          {/* Points input (if points program) */}
          {activeCard.programType === "points" && (
            <div className="border-border bg-card space-y-2 rounded-2xl border p-4 shadow-xs">
              <label
                htmlFor="spend-amount-input"
                className="text-foreground text-xs font-bold"
              >
                Montant de l&apos;achat (en DA)
              </label>
              <div className="relative">
                <Input
                  id="spend-amount-input"
                  type="number"
                  inputMode="numeric"
                  placeholder="Ex : 250"
                  value={spendInput}
                  onChange={(e) => setSpendInput(e.target.value)}
                  className="pr-12 font-mono text-base font-bold"
                  autoFocus
                />
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold">
                  DA
                </span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                1 DA dépensé = 1 point fidélité crédité au client.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetToScan}
              disabled={isSubmitting}
              className="h-12 flex-1 rounded-2xl font-bold"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAdd}
              disabled={
                isSubmitting ||
                (activeCard.isCooldownActive && !bypassCooldown) ||
                (activeCard.programType === "points" &&
                  (!spendInput.trim() || Number(spendInput) <= 0))
              }
              className="h-12 flex-1 rounded-2xl font-bold shadow-md"
            >
              {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
              {!isSubmitting &&
                (activeCard.programType === "points"
                  ? `Créditer ${spendInput ? Math.round(Number(spendInput)) : 0} pts`
                  : "+1 Tampon")}
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 3: SUCCESS CONFIRMATION & UNDO
          ========================================================================= */}
      {currentStep === "success" && successData && (
        <div className="border-border bg-card space-y-6 rounded-3xl border p-6 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Check className="h-8 w-8 stroke-[3]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-foreground text-2xl font-black tracking-tight">
              {successData.isCanceled
                ? "Opération Annulée"
                : "Opération Réussie !"}
            </h2>
            <p className="text-muted-foreground text-xs">
              Client : {successData.customerCode}
            </p>
          </div>

          {/* Balance card */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-muted-foreground text-xs font-semibold uppercase">
              Nouveau Solde
            </div>
            <div className="text-foreground mt-1 text-3xl font-extrabold">
              {successData.newBalance}{" "}
              <span className="text-muted-foreground text-sm font-medium">
                {successData.programType === "points" ? "points" : "tampons"}
              </span>
            </div>
            {!successData.isCanceled && (
              <div className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{successData.addedAmount}{" "}
                {successData.programType === "points" ? "points" : "tampon"}
              </div>
            )}
          </div>

          {cancelFeedback && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              {cancelFeedback}
            </div>
          )}

          {/* Action buttons: Undo & Next Client */}
          <div className="space-y-3 pt-2">
            {!successData.isCanceled && (
              <Button
                type="button"
                variant="outline"
                onClick={handleUndoTransaction}
                disabled={isCanceling}
                className="hover:text-destructive hover:bg-destructive/10 h-11 w-full rounded-2xl text-xs font-bold transition-colors"
              >
                {isCanceling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                <span>Annuler cette opération (erreur)</span>
              </Button>
            )}

            <Button
              type="button"
              onClick={handleResetToScan}
              className="h-12 w-full rounded-2xl font-bold shadow-md"
            >
              <span>Scanner le client suivant</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
