"use client";

import { Html5Qrcode } from "html5-qrcode";
import { TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";

interface CameraViewProps {
  error: string | null;
  isProcessing: boolean;
  isScanning: boolean;
  onScan: (token: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export const CameraView = ({
  error,
  isProcessing,
  isScanning,
  onScan,
  onScanError,
}: CameraViewProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isScanning) {
      return;
    }

    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { height: 250, width: 250 },
          },
          async (decodedText: string) => {
            let token = decodedText.trim();
            if (token.includes("/c/")) {
              const parts = token.split("/c/");
              token = parts.at(-1)?.split("?")[0] || token;
            }

            if (scanner.isScanning) {
              await scanner.stop();
            }

            onScan(token);
          },
          () => {
            // Frame scan callback without detection
          }
        );
      } catch {
        if (onScanError) {
          onScanError(
            "Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur."
          );
        }
      }
    };

    startScanner();

    return () => {
      if (scanner.isScanning) {
        const cleanupScanner = async () => {
          try {
            await scanner.stop();
          } catch {
            // Scanner stopped during unmount
          }
        };
        cleanupScanner();
      }
    };
  }, [isScanning, onScan, onScanError]);

  return (
    <div className="space-y-4">
      <div className="border-border relative aspect-square overflow-hidden rounded-2xl border-2 bg-black shadow-md">
        <div id="reader" className="h-full w-full" />

        {isScanning && !isProcessing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="border-primary h-56 w-56 animate-pulse rounded-2xl border-2" />
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 text-white">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
            <p className="text-sm font-medium">Validation du tampon...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2.5 rounded-xl border p-3.5 text-xs">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
