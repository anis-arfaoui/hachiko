"use client";

import { ArrowLeft, Camera, HelpCircle } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useCallback, useState } from "react";

import { scanRedeemAction, scanStampAction } from "@/app/actions/customer";
import { CameraView } from "@/components/scanner/camera-view";
import { ScanFeedback } from "@/components/scanner/scan-feedback";
import type { ScanState } from "@/components/scanner/scan-feedback";
import { Button } from "@/components/ui/button";
import { useActiveOrganization } from "@/lib/auth-client";

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

const TillScannerPage = () => {
  const locale = useLocale();
  const { data: activeOrg } = useActiveOrganization();

  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = () => {
    setCameraError(null);
    setScanState({ status: "scanning" });
  };

  const handleProcessScan = useCallback(async (token: string) => {
    setScanState({ status: "processing" });

    try {
      const clientUuid = crypto.randomUUID();
      const res = await scanStampAction({
        clientUuid,
        token,
      });

      if (!res.success) {
        if (res.error === "COOLDOWN_ACTIVE") {
          setScanState({
            remainingSeconds: res.remainingSeconds,
            status: "cooldown",
          });
        } else if (res.error === "UNAUTHORIZED_ORGANIZATION") {
          setScanState({
            message: "Cette carte appartient à un autre commerce.",
            status: "error",
          });
        } else if (res.error === "CARD_NOT_FOUND") {
          setScanState({
            message: "Carte client introuvable ou QR code invalide.",
            status: "error",
          });
        } else {
          setScanState({
            message: "Erreur de validation du tampon.",
            status: "error",
          });
        }
        return;
      }

      playSuccessBeep();
      triggerHaptic();

      setScanState({
        balance: res.balance,
        isDuplicate: res.isDuplicate,
        rewardReady: res.rewardReady,
        stampsRequired: res.stampsRequired,
        status: "success",
        token,
      });
    } catch {
      setScanState({
        message: "Erreur réseau. Impossible de contacter le serveur.",
        status: "error",
      });
    }
  }, []);

  const handleRedeem = useCallback(async (token: string) => {
    setScanState({ status: "processing" });

    try {
      const res = await scanRedeemAction(token);
      if (res.success) {
        playSuccessBeep();
        triggerHaptic();
        setScanState({
          rewardLabel: res.rewardLabel,
          status: "redeemed",
        });
      } else {
        setScanState({
          message: "Impossible de valider le cadeau pour le moment.",
          status: "error",
        });
      }
    } catch {
      setScanState({
        message: "Erreur lors de la validation du cadeau.",
        status: "error",
      });
    }
  }, []);

  const handleCameraError = useCallback((errorMsg: string) => {
    setCameraError(errorMsg);
    setScanState({ status: "idle" });
  }, []);

  const isScanning = scanState.status === "scanning";
  const isProcessing = scanState.status === "processing";

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Top Header */}
      <header className="border-border bg-card sticky top-0 z-50 border-b px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link
            href={`/${locale}/dashboard`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Tableau de bord</span>
          </Link>

          <span className="text-foreground text-sm font-semibold">
            {activeOrg?.name ?? "Scanner de Caisse"}
          </span>
        </div>
      </header>

      {/* Main scanner view */}
      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 p-4">
        {/* Camera Viewfinder */}
        <CameraView
          error={cameraError}
          isProcessing={isProcessing}
          isScanning={isScanning}
          onScan={handleProcessScan}
          onScanError={handleCameraError}
        />

        {/* Feedback Cards */}
        <ScanFeedback
          onRedeem={handleRedeem}
          onScanNext={startCamera}
          scanState={scanState}
        />

        {/* Start camera trigger if idle */}
        {scanState.status === "idle" && (
          <Button size="lg" className="w-full" onClick={startCamera}>
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <span>Activer la caméra</span>
            </span>
          </Button>
        )}

        <div className="border-border bg-card text-muted-foreground space-y-1 rounded-xl border p-3.5 text-xs">
          <div className="text-foreground flex items-center gap-1.5 font-semibold">
            <HelpCircle className="text-primary h-3.5 w-3.5" />
            <span>Conseil d&apos;utilisation</span>
          </div>
          <p className="leading-relaxed">
            Positionnez le QR code du client dans le carré de visée. La
            validation est instantanée avec signal sonore et vibration.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TillScannerPage;
