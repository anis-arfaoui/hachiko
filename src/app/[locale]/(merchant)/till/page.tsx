"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  Gift,
  HelpCircle,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  TriangleAlert,
  User,
} from "lucide-react";
import { useLocale } from "next-intl";
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

const TillScannerPage = () => {
  const locale = useLocale();

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
  const handleRedeem = async () => {
    if (!activeCard) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await scanRedeemAction(activeCard.token);
      if (res.success) {
        playSuccessBeep();
        triggerHaptic();
        // Refresh active card balance
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

  // Cancel / Undo transaction from Stage 3
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

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 pb-12">
      {/* Back to Dashboard Link */}
      <div>
        <Link
          href={`/${locale}/dashboard`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Tableau de bord</span>
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
          <CameraView
            error={cameraError}
            isProcessing={isSearching}
            isScanning={isCameraActive}
            onScan={handleCameraScan}
            onScanError={handleScanError}
            onResetError={handleResetCameraError}
          />

          {!isCameraActive && (
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setCameraError(null);
                setIsCameraActive(true);
              }}
            >
              <span className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                <span>Activer la caméra</span>
              </span>
            </Button>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-border w-full border-t" />
            <span className="bg-background text-muted-foreground absolute px-3 text-xs tracking-wider uppercase">
              ou saisie manuelle
            </span>
          </div>

          {/* Manual Lookup Form */}
          <form onSubmit={handleManualSearchSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Code client (ex: C-9SYKSZ) ou N° tél"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 text-sm font-medium"
              />
              <Button
                type="submit"
                size="default"
                disabled={isSearching || !searchQuery.trim()}
                className="h-11 px-5"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {lookupError && (
              <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2 rounded-xl border p-3 text-xs">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}
          </form>

          {/* Help Tip */}
          <div className="border-border bg-card text-muted-foreground space-y-1 rounded-xl border p-3.5 text-xs">
            <div className="text-foreground flex items-center gap-1.5 font-semibold">
              <HelpCircle className="text-primary h-3.5 w-3.5" />
              <span>Conseil d&apos;utilisation</span>
            </div>
            <p className="leading-relaxed">
              Vous pouvez scanner le QR code directement avec la caméra ou taper
              le code client <strong>C-XXXXXX</strong> ou son numéro de
              téléphone.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 2: CUSTOMER CARD PREVIEW & AMOUNT INPUT
          ========================================================================= */}
      {currentStep === "preview" && activeCard && (
        <div className="space-y-4">
          {/* Customer Loyalty Card View (Styled with brand color) */}
          <div
            className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl transition-all"
            style={{ backgroundColor: activeCard.brandColor || "#18181b" }}
          >
            {/* Header: User Icon + Customer Code + Business Name */}
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

            {/* Points or Stamps Display */}
            {activeCard.programType === "points" ? (
              <div className="mt-5 space-y-3">
                <div>
                  <div className="text-4xl font-extrabold tracking-tight">
                    {activeCard.balance} pts
                  </div>
                  <div className="text-xs font-medium text-white/80">
                    Objectif : {activeCard.stampsRequired} pts
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/20 p-0.5">
                  <div
                    className="h-full rounded-full bg-white shadow-xs transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (activeCard.balance / activeCard.stampsRequired) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <div>
                  <div className="text-4xl font-extrabold tracking-tight">
                    {activeCard.balance} / {activeCard.stampsRequired}
                  </div>
                  <div className="text-xs font-medium text-white/80">
                    tampons collectés
                  </div>
                </div>

                {/* Stamp Dots */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {Array.from({ length: activeCard.stampsRequired }).map(
                    (_, idx) => {
                      const isCollected = idx < activeCard.balance;
                      return (
                        <div
                          key={`stamp-${idx}`}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                            isCollected
                              ? "border-white bg-white text-black shadow-xs"
                              : "border-white/40 bg-white/10"
                          )}
                        >
                          {isCollected && (
                            <Check className="h-4 w-4 stroke-[3]" />
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Yellow Reward Box */}
          {activeCard.rewardLabel && (
            <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
              <div className="flex items-center gap-2 font-medium">
                <Gift className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{activeCard.rewardLabel}</span>
              </div>

              {activeCard.balance >= activeCard.stampsRequired && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleRedeem}
                  disabled={isSubmitting}
                  className="h-8 bg-amber-600 font-bold text-white hover:bg-amber-700"
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  <span>Récompenser</span>
                </Button>
              )}
            </div>
          )}

          {/* Cooldown Warning & Bypass Banner */}
          {activeCard.isCooldownActive && (
            <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2 font-semibold">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Ce client a déjà été scanné il y a moins de 3 minutes (délai
                  restant : {activeCard.cooldownRemainingSeconds}s).
                </span>
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={bypassCooldown}
                  onChange={(e) => setBypassCooldown(e.target.checked)}
                  className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                />
                <span>Continuer quand même (ignorer le délai)</span>
              </label>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="spendAmountInput"
              className="text-foreground text-xs font-semibold"
            >
              {activeCard.programType === "points"
                ? "Montant (DA)"
                : "Montant (facultatif)"}
            </label>

            <div className="relative">
              <Input
                id="spendAmountInput"
                type="number"
                min={0}
                step="any"
                placeholder={
                  activeCard.programType === "points" ? "0 DA" : "— DA"
                }
                value={spendInput}
                onChange={(e) => setSpendInput(e.target.value)}
                className="h-12 text-base font-semibold"
              />
              <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-bold">
                DA
              </span>
            </div>

            {activeCard.programType === "points" && (
              <p className="text-muted-foreground text-xs">
                Ajoutera {Number(spendInput) || 0} points sur la carte du
                client.
              </p>
            )}
          </div>

          {/* Error Message */}
          {actionError && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2 rounded-xl border p-3 text-xs">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Confirmation Action Button */}
          <Button
            size="lg"
            className="h-12 w-full text-base font-bold shadow-md"
            style={{
              backgroundColor: activeCard.brandColor || undefined,
            }}
            onClick={handleConfirmAdd}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <span>
                  {activeCard.programType === "points"
                    ? "+ Ajouter des points"
                    : "+ Ajouter un tampon"}
                </span>
              </span>
            )}
          </Button>

          {/* Secondary Action: Scan Another Client */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleResetToScan}
              className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium underline underline-offset-4 transition-colors"
            >
              Scanner un autre client
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 3: SUCCESS & UNDO VIEW
          ========================================================================= */}
      {currentStep === "success" && successData && (
        <div className="space-y-6 pt-4 text-center">
          {/* Big Green Check Icon */}
          <div className="flex justify-center">
            <div className="flex h-18 w-18 items-center justify-center rounded-full border-4 border-emerald-500 text-emerald-500 shadow-md">
              <Check className="h-9 w-9 stroke-[3]" />
            </div>
          </div>

          {/* Heading & Customer Code */}
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Mis à jour !
            </h2>
            <p className="text-muted-foreground font-mono text-sm font-semibold">
              {successData.customerCode}
            </p>
          </div>

          {/* Card Badge with Updated Balance */}
          <div
            className="mx-auto max-w-xs rounded-2xl p-4 text-white shadow-md transition-all"
            style={{ backgroundColor: activeCard?.brandColor || "#18181b" }}
          >
            <div className="text-3xl font-extrabold tracking-tight">
              {successData.programType === "points"
                ? `${successData.newBalance} pts`
                : `${successData.newBalance} / ${successData.stampsRequired}`}
            </div>
            <p className="mt-0.5 text-xs font-medium text-white/80">
              {successData.programType === "points"
                ? `sur ${successData.stampsRequired} pts`
                : "tampons collectés"}
            </p>
          </div>

          {/* Cancel / Undo Operation Link */}
          {successData.isCanceled ? (
            <p className="text-xs font-semibold text-emerald-600">
              Opération annulée avec succès !
            </p>
          ) : (
            <div>
              <button
                type="button"
                onClick={handleUndoTransaction}
                disabled={isCanceling}
                className="text-muted-foreground hover:text-destructive inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium transition-colors"
              >
                {isCanceling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                <span>Annuler cette opération</span>
              </button>
            </div>
          )}

          {cancelFeedback && !successData.isCanceled && (
            <p className="text-muted-foreground text-xs">{cancelFeedback}</p>
          )}

          {/* Big Primary Button: Scan Next Client */}
          <Button
            size="lg"
            className="h-12 w-full text-base font-bold shadow-md"
            style={{ backgroundColor: activeCard?.brandColor || undefined }}
            onClick={handleResetToScan}
          >
            Scanner un autre client
          </Button>
        </div>
      )}
    </div>
  );
};

export default TillScannerPage;
