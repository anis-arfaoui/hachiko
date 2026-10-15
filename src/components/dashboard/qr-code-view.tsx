"use client";

import { Check, Copy, Download, ExternalLink, HelpCircle } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface QrCodeViewProps {
  brandColor?: string;
  businessName: string;
  locale: string;
  orgSlug: string;
}

export const QrCodeView = ({
  brandColor = "#18181b",
  businessName,
  locale,
  orgSlug,
}: QrCodeViewProps) => {
  const relativeJoinPath = `/${locale}/j/${orgSlug}`;
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [displayUrl, setDisplayUrl] = useState(relativeJoinPath);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const generateQr = async () => {
      try {
        const origin =
          typeof window === "undefined" ? "" : window.location.origin;
        const fullUrl = `${origin}${relativeJoinPath}`;

        const url = await QRCode.toDataURL(fullUrl, {
          errorCorrectionLevel: "H",
          margin: 1,
          scale: 8,
          width: 320,
        });

        if (isActive) {
          setDisplayUrl(fullUrl);
          setQrDataUrl(url);
        }
      } catch {
        if (isActive) {
          setQrDataUrl(null);
        }
      }
    };

    generateQr();

    return () => {
      isActive = false;
    };
  }, [relativeJoinPath]);

  const handleCopyLink = useCallback(() => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const fullUrl = `${origin}${relativeJoinPath}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [relativeJoinPath]);

  const handleDownloadSvg = useCallback(async () => {
    setIsDownloading(true);
    try {
      const origin =
        typeof window === "undefined" ? "" : window.location.origin;
      const fullUrl = `${origin}${relativeJoinPath}`;

      const svgString = await QRCode.toString(fullUrl, {
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
        margin: 2,
        type: "svg",
      });

      const blob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `qr-code-${orgSlug}.svg`;
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(downloadUrl);
      setIsDownloading(false);
    } catch {
      setIsDownloading(false);
    }
  }, [relativeJoinPath, orgSlug]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Title Header */}
      <div className="space-y-1 text-center">
        <h1 className="text-foreground text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
          QR CODE
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Affichez ce QR code dans votre établissement pour que vos clients
          s&apos;inscrivent
        </p>
      </div>

      {/* Main QR Card Container */}
      <div className="border-border bg-card rounded-3xl border p-6 text-center shadow-xs sm:p-8">
        {/* QR Code with thick rounded brand color border */}
        <div className="inline-block p-1">
          <div
            className="overflow-hidden rounded-3xl p-3 shadow-md transition-colors"
            style={{
              backgroundColor: brandColor,
            }}
          >
            <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-white p-2 shadow-xs sm:h-72 sm:w-72">
              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt={`QR code d'inscription pour ${businessName}`}
                  width={280}
                  height={280}
                  unoptimized
                  priority
                  className="rounded-xl"
                />
              ) : (
                <div className="text-muted-foreground text-xs">
                  Génération du QR code...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Business details under QR */}
        <div className="mt-4 space-y-1">
          <h2 className="text-foreground text-base font-bold sm:text-lg">
            {businessName}
          </h2>
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-xs transition-colors"
          >
            <span className="max-w-[280px] truncate sm:max-w-[360px]">
              {displayUrl}
            </span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>

        {/* Action Buttons: Copy link & Download SVG */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleCopyLink}
            className="h-11 flex-1 font-semibold"
          >
            {copied ? (
              <span className="text-primary flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                <span>Lien copié !</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Copy className="h-4 w-4" />
                <span>Copier le lien</span>
              </span>
            )}
          </Button>

          <Button
            type="button"
            size="lg"
            onClick={handleDownloadSvg}
            disabled={isDownloading}
            className="h-11 flex-1 bg-zinc-900 font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <span className="flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              <span>
                {isDownloading ? "Téléchargement..." : "Télécharger SVG"}
              </span>
            </span>
          </Button>
        </div>
      </div>

      {/* Guide: How to use this QR code */}
      <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
        <div className="text-foreground flex items-center gap-2 text-sm font-bold">
          <HelpCircle className="text-primary h-4 w-4 shrink-0" />
          <span>Comment utiliser ce QR code ?</span>
        </div>

        <ol className="text-muted-foreground mt-3 space-y-2 text-xs leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-foreground font-bold">1.</span>
            <span>
              Imprimez-le et affichez-le sur votre comptoir, table ou menu.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-foreground font-bold">2.</span>
            <span>
              Le client scanne avec l&apos;appareil photo de son téléphone et
              renseigne son prénom, nom et numéro de téléphone.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-foreground font-bold">3.</span>
            <span>
              Sa carte de fidélité s&apos;ouvre directement dans son navigateur
              (sans aucune application à télécharger).
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
};
