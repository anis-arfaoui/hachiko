"use client";

import {
  Camera,
  Check,
  Gift,
  Loader2,
  QrCode,
  RotateCcw,
  ScanLine,
  Sparkles,
  TriangleAlert,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import type {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  cashierCancelTransactionAction,
  cashierLookupCustomerAction,
  cashierRedeemAction,
  cashierScanStampAction,
  verifyCashierCodeAction,
} from "@/app/actions/cashier";
import type { VerifyCashierResult } from "@/app/actions/cashier";
import { CameraView } from "@/components/scanner/camera-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CardDetailsWithCooldown } from "@/dal/card";
import { cn } from "@/lib/utils";

interface CashierPortalViewProps {
  initialCode?: string;
  locale: string;
}

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

type CashierStep = "scanner" | "preview" | "success";

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

const DIGIT_SLOT_KEYS = [
  "csh-slot-1",
  "csh-slot-2",
  "csh-slot-3",
  "csh-slot-4",
  "csh-slot-5",
  "csh-slot-6",
] as const;

const extractCodeFromText = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.includes("code=")) {
    try {
      const url = new URL(
        trimmed.startsWith("http") ? trimmed : `https://walaa.app/${trimmed}`
      );
      const param = url.searchParams.get("code");
      if (param) {
        return param;
      }
    } catch {
      // Ignore URL parsing error
    }
  }
  return trimmed;
};

export const CashierPortalView = ({
  initialCode = "",
}: CashierPortalViewProps) => {
  // Session state
  const [cashierData, setCashierData] = useState<VerifyCashierResult | null>(
    null
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // 6-digit OTP boxes state
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Pairing QR Scanner modal (to scan manager's screen)
  const [isScanningPairingQr, setIsScanningPairingQr] = useState(false);
  const [pairingCameraError, setPairingCameraError] = useState<string | null>(
    null
  );

  // Stage in cashier mode: "scanner" -> "preview" -> "success"
  const [currentStep, setCurrentStep] = useState<CashierStep>("scanner");

  // Client scanning & lookup state
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Stage 2: Active card preview
  const [activeCard, setActiveCard] = useState<CardDetailsWithCooldown | null>(
    null
  );
  const [spendInput, setSpendInput] = useState("");
  const [bypassCooldown, setBypassCooldown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Stage 3: Confirmation
  const [successData, setSuccessData] = useState<SuccessState | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  // Verify function
  const handleVerify = useCallback(async (codeToVerify: string) => {
    const clean = codeToVerify.trim();
    if (!clean) {
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await verifyCashierCodeAction(clean);
      if (res.success && res.cashier) {
        setCashierData(res);
        setCurrentStep("scanner");
        setIsCameraActive(true);
      } else {
        setVerifyError(
          res.error ||
            "Code invalide. Vérifiez le code à 6 chiffres affiché par votre gérant."
        );
      }
    } catch {
      setVerifyError("Erreur de connexion lors de la vérification du code.");
    }

    setIsVerifying(false);
  }, []);

  // Auto-verify if initialCode is provided in URL
  const initialVerifiedRef = useRef(false);
  useEffect(() => {
    let isMounted = true;
    if (
      initialCode &&
      initialCode.trim().length > 0 &&
      !initialVerifiedRef.current
    ) {
      initialVerifiedRef.current = true;
      const verifyInitial = async () => {
        setIsVerifying(true);
        setVerifyError(null);
        try {
          const res = await verifyCashierCodeAction(initialCode.trim());
          if (isMounted) {
            if (res.success && res.cashier) {
              setCashierData(res);
              setCurrentStep("scanner");
              setIsCameraActive(true);
            } else {
              setVerifyError(
                res.error ||
                  "Code invalide. Vérifiez le code à 6 chiffres affiché par votre gérant."
              );
            }
          }
        } catch {
          if (isMounted) {
            setVerifyError(
              "Erreur de connexion lors de la vérification du code."
            );
          }
        }
        if (isMounted) {
          setIsVerifying(false);
        }
      };
      void verifyInitial();
    }
    return () => {
      isMounted = false;
    };
  }, [initialCode]);

  // Handle Digit Box changes
  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && newDigits.every((d) => d !== "")) {
      void handleVerify(fullCode);
    }
  };

  const handleDigitKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    if (!pasted) {
      return;
    }

    const extracted = extractCodeFromText(pasted);
    const numericOnly = extracted.replaceAll(/\D/gu, "");
    if (numericOnly.length >= 6) {
      const code6 = numericOnly.slice(0, 6);
      const split6 = code6.split("");
      setDigits(split6);
      inputRefs.current[5]?.focus();
      void handleVerify(code6);
    } else if (extracted.length > 0) {
      void handleVerify(extracted);
    }
  };

  // Handle Scanning Manager's pairing QR code
  const handlePairingQrScan = (tokenOrUrl: string) => {
    setIsScanningPairingQr(false);
    const code = extractCodeFromText(tokenOrUrl);
    const cleanDigits = code.replaceAll(/\D/gu, "");
    if (cleanDigits.length === 6) {
      setDigits(cleanDigits.split(""));
    }
    void handleVerify(code);
  };

  // Reset to scanner
  const handleResetToScanner = useCallback(() => {
    setCurrentStep("scanner");
    setActiveCard(null);
    setSpendInput("");
    setBypassCooldown(false);
    setActionError(null);
    setLookupError(null);
    setSuccessData(null);
    setCancelFeedback(null);
    setIsCameraActive(true);
  }, []);

  // Customer lookup logic
  const handleLookupCustomer = useCallback(
    async (identifier: string) => {
      const trimmed = identifier.trim();
      if (!trimmed || !cashierData?.cashier) {
        return;
      }

      setIsSearching(true);
      setLookupError(null);

      try {
        const res = await cashierLookupCustomerAction(
          cashierData.cashier.token,
          trimmed
        );
        if (!res.success || !res.card) {
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
        setLookupError(
          "Erreur de connexion. Impossible de contacter le serveur."
        );
        setIsSearching(false);
      }
    },
    [cashierData]
  );

  const handleCameraScan = useCallback(
    async (token: string) => {
      await handleLookupCustomer(token);
    },
    [handleLookupCustomer]
  );

  const handleManualSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleLookupCustomer(manualQuery);
  };

  // Submit stamp or points
  const handleConfirmAdd = async () => {
    if (!activeCard || !cashierData?.cashier) {
      return;
    }

    const isPoints = activeCard.programType === "points";
    const parsedSpend = Number(spendInput.trim());

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
      const res = await cashierScanStampAction({
        amount: pointsAmount,
        cashierCodeOrToken: cashierData.cashier.token,
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
        } else if (res.error === "SUBSCRIPTION_EXPIRED") {
          setActionError(
            "L'abonnement de cet établissement a expiré. Veuillez contacter le gérant pour renouveler l'accès."
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

  // Redeem reward
  const handleRedeem = async (rewardId?: string) => {
    if (!activeCard || !cashierData?.cashier) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await cashierRedeemAction(
        cashierData.cashier.token,
        activeCard.token,
        rewardId
      );

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

  // Undo transaction
  const handleUndoTransaction = async () => {
    if (
      !successData?.transactionId ||
      successData.isCanceled ||
      !cashierData?.cashier
    ) {
      return;
    }

    setIsCanceling(true);

    try {
      const res = await cashierCancelTransactionAction(
        cashierData.cashier.token,
        successData.transactionId
      );
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

  // =========================================================================
  // VIEW 1: ACTIVATION SCREEN (matching screen104.png)
  // =========================================================================
  if (!cashierData?.cashier) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between bg-white px-4 py-8 text-zinc-900 sm:px-6 sm:py-12">
        <div className="my-auto w-full max-w-md space-y-8 text-center">
          {/* Scanner Icon in dark square */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-md">
              <ScanLine className="h-8 w-8 stroke-[2.5]" />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 uppercase sm:text-4xl">
              Activer cette caisse
            </h1>
            <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500 sm:text-sm">
              Demandez le code au gérant : il l&apos;affiche depuis son espace
              Walaa, dans la page Caisses employé.
            </p>
          </div>

          {/* Button: Scanner le QR du gérant */}
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={() => setIsScanningPairingQr(true)}
              className="h-12 w-full max-w-xs rounded-2xl bg-zinc-950 text-sm font-bold text-white shadow-md transition-all hover:bg-zinc-800 active:translate-y-0.5"
            >
              <QrCode className="mr-2 h-5 w-5" />
              <span>Scanner le QR du gérant</span>
            </Button>
          </div>

          {/* Modal to scan manager QR */}
          {isScanningPairingQr && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
              <div className="relative w-full max-w-sm space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900">
                    Scannez le code du gérant
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsScanningPairingQr(false)}
                    aria-label="Fermer"
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <CameraView
                  error={pairingCameraError}
                  isProcessing={false}
                  isScanning={true}
                  onScan={handlePairingQrScan}
                  onScanError={(err) => setPairingCameraError(err)}
                  onResetError={() => setPairingCameraError(null)}
                />
                <p className="text-center text-xs text-zinc-500">
                  Pointez vers le QR code affiché sur l&apos;écran du gérant.
                </p>
              </div>
            </div>
          )}

          {/* Divider: OU SAISISSEZ LE CODE */}
          <div className="relative mx-auto flex w-full max-w-xs items-center justify-center">
            <div className="w-full border-t border-zinc-200" />
            <span className="absolute bg-white px-3 text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
              ou saisissez le code
            </span>
          </div>

          {/* 6-Digit Code Input Boxes */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {DIGIT_SLOT_KEYS.map((slotKey, idx) => (
                <input
                  key={slotKey}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digits[idx]}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleDigitChange(idx, e.target.value)
                  }
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  onPaste={handleDigitPaste}
                  disabled={isVerifying}
                  className={cn(
                    "h-16 w-11 rounded-2xl border-2 border-zinc-200 bg-white text-center font-mono text-2xl font-black text-zinc-900 shadow-xs transition-all focus:border-zinc-950 focus:outline-none sm:w-12",
                    digits[idx] && "border-zinc-950"
                  )}
                />
              ))}
            </div>

            {isVerifying && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-900" />
                <span>Vérification de la caisse...</span>
              </div>
            )}

            {verifyError && (
              <div className="mx-auto max-w-xs rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                {verifyError}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Propulsé par Walaa */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-zinc-400">
          <span>Propulsé par</span>
          <div className="flex items-center gap-1.5 font-bold text-zinc-700">
            <Image
              src="/icon.png"
              alt="Walaa"
              width={18}
              height={18}
              className="h-4 w-4 rounded-full object-cover"
            />
            <span>Walaa</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE CASHIER SCANNER (matching screen105.png)
  // =========================================================================
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-between bg-white p-4 text-zinc-900 sm:p-6">
      <div className="space-y-6">
        {/* Top Bar: Brand Logo + Names (left) and Cashier Name pill badge (right). NO LOGOUT BUTTON */}
        <header className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            <Image
              src={cashierData.organization?.logo || "/icon.png"}
              alt="Logo"
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover shadow-xs"
              unoptimized={Boolean(cashierData.organization?.logo)}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-zinc-900">
                Walaa
              </span>
              <span className="text-sm font-bold text-zinc-700">
                {cashierData.organization?.name || "Commerce"}
              </span>
            </div>
          </div>

          {/* Cashier pill badge (matching screen105.png: coucou) - NO LOGOUT BUTTON */}
          <div className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs">
            {cashierData.cashier.name}
          </div>
        </header>

        {/* =====================================================================
            STAGE 1: CAMERA SCANNER (matching screen105.png)
            ===================================================================== */}
        {currentStep === "scanner" && (
          <div className="space-y-6 pt-2">
            {/* Mode Caisse Label */}
            <div className="flex items-center justify-center gap-1.5 text-center">
              <ScanLine className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-black tracking-[0.2em] text-zinc-400 uppercase">
                Mode Caisse
              </span>
            </div>

            {/* Camera Viewfinder (Rounded container with reticle overlay matching screen105.png) */}
            <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl bg-black shadow-lg">
              <CameraView
                error={cameraError}
                isProcessing={isSearching}
                isScanning={isCameraActive}
                onScan={handleCameraScan}
                onScanError={(err) => setCameraError(err)}
                onResetError={() => {
                  setCameraError(null);
                  setIsCameraActive(true);
                }}
              />

              {/* White corner reticles and guide text overlay (matching screen105.png) */}
              {isCameraActive && !cameraError && (
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
                  <div className="flex items-start justify-between">
                    <div className="h-8 w-8 rounded-tl-sm border-t-4 border-l-4 border-white" />
                    <div className="h-8 w-8 rounded-tr-sm border-t-4 border-r-4 border-white" />
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-full border-t border-white/60 shadow-sm" />
                  </div>
                  <div>
                    <p className="mb-2 text-center text-[11px] font-semibold text-white/90 drop-shadow-md">
                      Pointez vers le QR code du client
                    </p>
                    <div className="flex items-end justify-between">
                      <div className="h-8 w-8 rounded-bl-sm border-b-4 border-l-4 border-white" />
                      <div className="h-8 w-8 rounded-br-sm border-r-4 border-b-4 border-white" />
                    </div>
                  </div>
                </div>
              )}

              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <Button
                    size="lg"
                    className="w-full max-w-xs bg-white font-bold text-zinc-900 hover:bg-zinc-100"
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

            {/* Instruction Below Camera (matching screen105.png) */}
            <div className="space-y-3 pt-1 text-center">
              <p className="text-xs font-medium text-zinc-500">
                La caméra ne lit pas ? Entrez le code client, ou collez le lien
                de sa carte :
              </p>

              <form onSubmit={handleManualSearchSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Code client C-XXXXXX, ou lien de la carte"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="h-11 rounded-xl border-zinc-200 bg-white text-xs font-medium text-zinc-900 shadow-xs placeholder:text-zinc-400"
                />
                <Button
                  type="submit"
                  disabled={isSearching || !manualQuery.trim()}
                  className="h-11 rounded-xl bg-zinc-400 px-5 text-xs font-bold text-white transition-colors hover:bg-zinc-500"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "OK"
                  )}
                </Button>
              </form>

              {lookupError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-xs font-semibold text-red-600">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            STAGE 2: CUSTOMER CARD PREVIEW & AMOUNT INPUT
            ===================================================================== */}
        {currentStep === "preview" && activeCard && (
          <div className="space-y-4 pt-2">
            {/* Card Visual */}
            <div
              className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl transition-all"
              style={{
                backgroundColor:
                  activeCard.brandColor ||
                  cashierData.program?.brandColor ||
                  "#18181b",
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
                <div className="mt-5 space-y-3">
                  <div>
                    <div className="text-4xl font-extrabold tracking-tight">
                      {activeCard.balance} pts
                    </div>
                    <div className="text-xs font-medium text-white/80">
                      Objectif : {activeCard.stampsRequired} pts
                    </div>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/20 p-0.5">
                    <div
                      className="h-full rounded-full bg-white shadow-xs transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (activeCard.balance / activeCard.stampsRequired) *
                              100
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

                  <div className="flex flex-wrap gap-2 pt-1">
                    {Array.from({ length: activeCard.stampsRequired }).map(
                      (_, idx) => {
                        const isCollected = idx < activeCard.balance;
                        return (
                          <div
                            key={`preview-stamp-${idx}`}
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

            {/* Rewards Section */}
            {activeCard.rewards && activeCard.rewards.length > 0 && (
              <div className="space-y-2">
                <div className="text-foreground flex items-center justify-between px-1 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Gift className="h-4 w-4 text-amber-500" />
                    <span>Récompenses disponibles</span>
                  </span>
                  <span className="text-muted-foreground text-[11px] font-medium">
                    {activeCard.balance}{" "}
                    {activeCard.programType === "points" ? "pts" : "tampons"}
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
                            ? "border-amber-300 bg-amber-50/80 text-amber-950"
                            : "border-zinc-200 bg-zinc-50/60 text-zinc-500 opacity-70"
                        )}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2 font-semibold">
                            <Gift
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                canRedeem ? "text-amber-600" : "text-zinc-400"
                              )}
                            />
                            <span className="truncate">{reward.label}</span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-zinc-500">
                            Coût : {reward.cost}{" "}
                            {activeCard.programType === "points"
                              ? "points"
                              : "tampons"}
                            {reward.description
                              ? ` • ${reward.description}`
                              : ""}
                          </div>
                        </div>

                        {canRedeem ? (
                          <Button
                            size="sm"
                            onClick={() => handleRedeem(reward.id)}
                            disabled={isSubmitting}
                            className="h-8 shrink-0 bg-amber-600 font-bold text-white hover:bg-amber-700"
                          >
                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                            <span>Récompenser (-{reward.cost})</span>
                          </Button>
                        ) : (
                          <span className="shrink-0 text-[11px] font-medium text-zinc-400">
                            Manque {reward.cost - activeCard.balance}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cooldown Warning */}
            {activeCard.isCooldownActive && (
              <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900">
                <div className="flex items-start gap-2 font-semibold">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Ce client a déjà été scanné il y a moins de 3 minutes (délai
                    restant : {activeCard.cooldownRemainingSeconds}s).
                  </span>
                </div>
                <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs font-medium text-amber-950">
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
                htmlFor="cashierSpendInput"
                className="text-foreground text-xs font-semibold"
              >
                {activeCard.programType === "points"
                  ? "Montant (DA)"
                  : "Montant (facultatif)"}
              </label>

              <div className="relative">
                <Input
                  id="cashierSpendInput"
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
            </div>

            {actionError && (
              <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2 rounded-xl border p-3 text-xs">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Confirm Button */}
            <Button
              size="lg"
              className="h-12 w-full text-base font-bold shadow-md"
              style={{
                backgroundColor:
                  activeCard.brandColor ||
                  cashierData.program?.brandColor ||
                  undefined,
              }}
              onClick={handleConfirmAdd}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <span>
                  {activeCard.programType === "points"
                    ? "+ Ajouter des points"
                    : "+ Ajouter un tampon"}
                </span>
              )}
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleResetToScanner}
                className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium underline underline-offset-4 transition-colors"
              >
                Scanner un autre client
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            STAGE 3: SUCCESS & UNDO VIEW
            ===================================================================== */}
        {currentStep === "success" && successData && (
          <div className="space-y-6 pt-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-18 w-18 items-center justify-center rounded-full border-4 border-emerald-500 text-emerald-500 shadow-md">
                <Check className="h-9 w-9 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold tracking-tight">
                Mis à jour !
              </h2>
              <p className="text-muted-foreground font-mono text-sm font-semibold">
                {successData.customerCode}
              </p>
            </div>

            <div
              className="mx-auto max-w-xs rounded-2xl p-4 text-white shadow-md transition-all"
              style={{
                backgroundColor:
                  activeCard?.brandColor ||
                  cashierData.program?.brandColor ||
                  "#18181b",
              }}
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

            <Button
              size="lg"
              className="h-12 w-full text-base font-bold shadow-md"
              style={{
                backgroundColor:
                  activeCard?.brandColor ||
                  cashierData.program?.brandColor ||
                  undefined,
              }}
              onClick={handleResetToScanner}
            >
              Scanner un autre client
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="pt-8 text-center text-xs text-zinc-400">
        <span>Caisse enregistrée sous </span>
        <strong className="text-zinc-600">
          {cashierData.organization?.name}
        </strong>
      </footer>
    </div>
  );
};
