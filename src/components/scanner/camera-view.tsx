"use client";

import { Html5Qrcode } from "html5-qrcode";
import type { CameraDevice } from "html5-qrcode";
import { Camera, RefreshCw, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CameraViewProps {
  error: string | null;
  isProcessing: boolean;
  isScanning: boolean;
  onResetError?: () => void;
  onScan: (token: string) => void;
  onScanError?: (errorMessage: string) => void;
}

const formatCameraError = (error: Error): string => {
  if (
    error.name === "NotAllowedError" ||
    error.name === "PermissionDeniedError"
  ) {
    return "Accès à la caméra refusé. Veuillez autoriser la caméra dans votre navigateur (icône cadenas ou caméra dans la barre d'adresse).";
  }
  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return "Aucune caméra détectée sur cet appareil. Veuillez brancher une webcam ou utiliser la recherche manuelle ci-dessous.";
  }
  if (error.name === "NotReadableError" || error.name === "TrackStartError") {
    return "La caméra est déjà utilisée par une autre application (Zoom, Teams, autre onglet). Veuillez la fermer et réessayer.";
  }
  if (error.name === "OverconstrainedError") {
    return "La caméra ne prend pas en charge la configuration demandée.";
  }
  if (error.message) {
    return error.message;
  }
  return "Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.";
};

const handleFrameScanNoop = () => {
  // Frame scanned without QR match
};

export const CameraView = ({
  error: externalError,
  isProcessing,
  isScanning,
  onResetError,
  onScan,
  onScanError,
}: CameraViewProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const onScanErrorRef = useRef(onScanError);
  const currentCameraIdRef = useRef<string | null>(null);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    onScanRef.current = onScan;
    onScanErrorRef.current = onScanError;
  }, [onScan, onScanError]);

  const handleQrSuccess = useCallback(async (decodedText: string) => {
    let token = decodedText.trim();
    if (token.includes("/c/")) {
      const parts = token.split("/c/");
      token = parts.at(-1)?.split("?")[0] || token;
    }

    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {
      // Ignore stop error
    }

    onScanRef.current(token);
  }, []);

  useEffect(() => {
    if (!isScanning) {
      return;
    }

    const attemptNumber = retryCount;
    let isCancelled = false;

    const startScanner = async () => {
      if (attemptNumber < 0) {
        return;
      }
      setIsInitializing(true);

      // 1. Check MediaDevices support and secure context
      if (
        typeof window === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setIsInitializing(false);
        const msg = window.isSecureContext
          ? "Votre navigateur ne prend pas en charge l'accès à la caméra."
          : "L'accès à la caméra requiert une connexion sécurisée (HTTPS ou localhost). Votre navigateur bloque l'accès en HTTP non sécurisé.";
        onScanErrorRef.current?.(msg);
        return;
      }

      try {
        // Clear previous container contents safely
        const readerElement = document.querySelector<HTMLDivElement>("#reader");
        if (readerElement) {
          readerElement.innerHTML = "";
        }

        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        const qrConfig = {
          fps: 10,
          qrbox: { height: 250, width: 250 },
        };

        let started = false;

        // Step 1: Enumerate devices via getCameras().
        // This prompts the user with standard video constraints (video: true),
        // preventing OverconstrainedError on desktop PC webcams while detecting back cameras on mobile.
        try {
          const devices = await Html5Qrcode.getCameras();
          if (isCancelled) {
            return;
          }

          if (devices && devices.length > 0) {
            setCameras(devices);
            // On mobile, prefer rear/environment camera; on PC, use first available webcam
            const backCamera = devices.find((d) =>
              /back|rear|environment|arrière|arriere/iu.test(d.label)
            );
            const chosen = backCamera ?? devices[0];
            currentCameraIdRef.current = chosen.id;

            await scanner.start(
              chosen.id,
              qrConfig,
              handleQrSuccess,
              handleFrameScanNoop
            );
            started = true;
          }
        } catch (error) {
          console.warn(
            "Html5Qrcode.getCameras failed or not yet allowed:",
            error
          );
        }

        // Step 2: Fallback to facingMode if getCameras couldn't start directly
        if (!started && !isCancelled) {
          try {
            // Try mobile back camera first
            await scanner.start(
              { facingMode: "environment" },
              qrConfig,
              handleQrSuccess,
              handleFrameScanNoop
            );
            started = true;
          } catch (error) {
            if (isCancelled) {
              return;
            }
            console.warn(
              "facingMode 'environment' unavailable (desktop webcam), falling back to 'user':",
              error
            );

            // Desktop / laptop webcam fallback
            try {
              await scanner.start(
                { facingMode: "user" },
                qrConfig,
                handleQrSuccess,
                handleFrameScanNoop
              );
              started = true;
            } catch (fallbackError) {
              if (isCancelled) {
                return;
              }
              const errObj =
                fallbackError instanceof Error
                  ? fallbackError
                  : new Error(String(fallbackError));
              setIsInitializing(false);
              onScanErrorRef.current?.(formatCameraError(errObj));
              return;
            }
          }
        }

        if (isCancelled) {
          if (scanner.isScanning) {
            try {
              await scanner.stop();
              scanner.clear();
            } catch {
              // Ignore cleanup error
            }
          }
        } else {
          setIsInitializing(false);
        }
      } catch (error) {
        if (!isCancelled) {
          setIsInitializing(false);
          const errObj =
            error instanceof Error ? error : new Error(String(error));
          onScanErrorRef.current?.(formatCameraError(errObj));
        }
      }
    };

    void startScanner();

    return () => {
      isCancelled = true;
      if (scannerRef.current) {
        const s = scannerRef.current;
        if (s.isScanning) {
          const stopScanning = async () => {
            try {
              await s.stop();
              s.clear();
            } catch {
              // Ignore error on unmount
            }
          };
          void stopScanning();
        }
      }
    };
  }, [isScanning, retryCount, handleQrSuccess]);

  const handleRetry = () => {
    onResetError?.();
    setRetryCount((prev) => prev + 1);
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1 || isSwitching) {
      return;
    }
    setIsSwitching(true);
    try {
      const currentIndex = cameras.findIndex(
        (c) => c.id === currentCameraIdRef.current
      );
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];

      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      currentCameraIdRef.current = nextCamera.id;
      await scannerRef.current?.start(
        nextCamera.id,
        {
          fps: 10,
          qrbox: { height: 250, width: 250 },
        },
        handleQrSuccess,
        handleFrameScanNoop
      );
      setIsSwitching(false);
    } catch (error) {
      console.warn("Failed to switch camera:", error);
      setIsSwitching(false);
    }
  };

  return (
    <div className="space-y-4">
      {cameras.length > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <Camera className="h-3.5 w-3.5" />
            <span>{cameras.length} caméras disponibles</span>
          </span>
          <button
            type="button"
            onClick={handleSwitchCamera}
            disabled={isSwitching}
            className="border-border bg-card hover:bg-muted text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw
              className={cn("h-3 w-3", isSwitching && "animate-spin")}
            />
            <span>Changer de caméra</span>
          </button>
        </div>
      )}

      <div className="border-border relative aspect-square overflow-hidden rounded-2xl border-2 bg-black shadow-md">
        <div
          id="reader"
          className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        />

        {/* Loading overlay when initializing camera */}
        {isInitializing && !externalError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/75 text-white backdrop-blur-xs">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-3 border-t-transparent" />
            <p className="text-xs font-semibold text-zinc-300">
              Connexion à la caméra...
            </p>
          </div>
        )}

        {/* Scan reticle */}
        {isScanning && !isProcessing && !isInitializing && !externalError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="border-primary h-56 w-56 animate-pulse rounded-2xl border-2 shadow-xs" />
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-white backdrop-blur-xs">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
            <p className="text-sm font-semibold">
              Validation du code client...
            </p>
          </div>
        )}
      </div>

      {externalError && (
        <div className="space-y-3">
          <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2.5 rounded-xl border p-3.5 text-xs">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">{externalError}</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Sur PC, vérifiez que votre webcam est connectée et que
                l&apos;icône de caméra dans la barre d&apos;adresse de votre
                navigateur autorise l&apos;accès.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="w-full text-xs font-semibold"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Réessayer d&apos;activer la caméra
          </Button>
        </div>
      )}
    </div>
  );
};
