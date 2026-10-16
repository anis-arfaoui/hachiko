"use client";

import { Loader2, QrCode, Shield, X } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { verifyManagerCodeAction } from "@/app/actions/manager";
import { CameraView } from "@/components/scanner/camera-view";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ManagerActivationViewProps {
  initialCode?: string;
}

const DIGIT_SLOT_KEYS = [
  "mgr-slot-1",
  "mgr-slot-2",
  "mgr-slot-3",
  "mgr-slot-4",
  "mgr-slot-5",
  "mgr-slot-6",
] as const;

const extractCodeFromText = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.includes("code=")) {
    try {
      const url = new URL(
        trimmed.startsWith("http") ? trimmed : `https://walaa.app/${trimmed}`
      );
      const c = url.searchParams.get("code");
      if (c && /^\d{6}$/u.test(c)) {
        return c;
      }
    } catch {
      // ignore
    }
  }

  const match = trimmed.match(/\b\d{6}\b/u);
  if (match) {
    return match[0];
  }

  return trimmed;
};

export const ManagerActivationView = ({
  initialCode,
}: ManagerActivationViewProps) => {
  const searchParams = useSearchParams();

  const codeFromUrl = searchParams?.get("code") || initialCode || "";

  const [digits, setDigits] = useState<string[]>(() => {
    if (codeFromUrl && /^\d{6}$/u.test(codeFromUrl)) {
      return codeFromUrl.split("");
    }
    return ["", "", "", "", "", ""];
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [isScanningPairingQr, setIsScanningPairingQr] = useState(false);
  const [pairingCameraError, setPairingCameraError] = useState<string | null>(
    null
  );

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Verification helper
  const handleVerifyCode = useCallback(
    async (codeToVerify: string) => {
      if (isVerifying) {
        return;
      }
      setIsVerifying(true);
      setVerifyError(null);

      try {
        const res = await verifyManagerCodeAction(codeToVerify);
        if (res.success && res.manager) {
          // Cookie is set, reload or navigate
          window.location.href = "/responsable";
        } else {
          setVerifyError(
            res.error || "Code invalide. Vérifiez le code à 6 chiffres."
          );
          setIsVerifying(false);
        }
      } catch {
        setVerifyError("Erreur réseau. Impossible de contacter le serveur.");
        setIsVerifying(false);
      }
    },
    [isVerifying]
  );

  const handleVerifyRef = useRef(handleVerifyCode);
  useEffect(() => {
    handleVerifyRef.current = handleVerifyCode;
  });

  // Auto-verify if code passed in URL
  useEffect(() => {
    if (codeFromUrl && /^\d{6}$/u.test(codeFromUrl)) {
      const timer = setTimeout(() => {
        void handleVerifyRef.current(codeFromUrl);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [codeFromUrl]);

  // Handle single digit change
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replaceAll(/\D/gu, "");
    if (!clean) {
      const copy = [...digits];
      copy[index] = "";
      setDigits(copy);
      return;
    }

    const single = clean.slice(-1);
    const copy = [...digits];
    copy[index] = single;
    setDigits(copy);
    setVerifyError(null);

    // Auto advance focus
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If completed 6 digits, trigger verification
    const full = copy.join("");
    if (full.length === 6) {
      void handleVerifyCode(full);
    }
  };

  // Handle Backspace navigation
  const handleDigitKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste full code
  const handleDigitPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    const extracted = extractCodeFromText(paste).replaceAll(/\D/gu, "");
    if (extracted.length >= 6) {
      const six = extracted.slice(0, 6);
      setDigits(six.split(""));
      setVerifyError(null);
      void handleVerifyCode(six);
    }
  };

  // Handle scanned pairing QR
  const handlePairingQrScan = (rawText: string) => {
    const code = extractCodeFromText(rawText);
    if (/^\d{6}$/u.test(code)) {
      setIsScanningPairingQr(false);
      setDigits(code.split(""));
      void handleVerifyCode(code);
    } else {
      setPairingCameraError("QR code invalide pour un responsable.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-white px-4 py-8 text-zinc-900 sm:px-6 sm:py-12">
      <div className="my-auto w-full max-w-md space-y-8 text-center">
        {/* Shield Icon in dark square */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-md">
            <Shield className="h-8 w-8 stroke-[2.5]" />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 uppercase sm:text-4xl">
            Espace Responsable
          </h1>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500 sm:text-sm">
            Demandez le code au propriétaire : il l&apos;affiche depuis son
            espace Walaa, dans la page Responsables.
          </p>
        </div>

        {/* Button: Scanner le QR du gérant (Dark button, NOT red!) */}
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
                Pointez vers le QR code affiché sur l&apos;écran du
                propriétaire.
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
              <span>Vérification de l&apos;accès responsable...</span>
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
};
