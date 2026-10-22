"use client";

import { Check, Copy, ExternalLink, QrCode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";

interface DashboardHeaderProps {
  businessName?: string;
  locale?: string;
  orgSlug: string;
}

export const DashboardHeader = ({
  businessName,
  locale: _locale,
  orgSlug,
}: DashboardHeaderProps) => {
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const relativePath = `/j/${orgSlug}`;

  const getFullUrl = useCallback(() => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return origin ? `${origin}/j/${orgSlug}` : relativePath;
  }, [orgSlug, relativePath]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFullUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isQrOpen) {
      return;
    }

    let isActive = true;
    const generateQr = async () => {
      try {
        const url = await QRCode.toDataURL(getFullUrl(), {
          errorCorrectionLevel: "H",
          margin: 2,
          scale: 8,
          width: 320,
        });
        if (isActive) {
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
  }, [getFullUrl, isQrOpen]);

  return (
    <>
      <PageHeader
        title="VUE D'ENSEMBLE"
        badge={
          <Badge variant="success" dot size="sm">
            En direct
          </Badge>
        }
        description="Aperçu des performances, passages en caisse et fidélisation de vos clients."
        actions={
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Lien adhésion client
            </span>

            <div className="border-border bg-card flex items-center gap-1 rounded-xl border p-1 shadow-xs">
              <span className="text-muted-foreground max-w-[150px] truncate px-2 font-mono text-xs sm:max-w-[220px]">
                {relativePath}
              </span>

              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopy}
                title="Copier le lien d'adhésion"
                className="hover:bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="text-primary h-3.5 w-3.5" />
                    <span className="text-primary font-bold">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>

              {/* QR Code trigger button */}
              <button
                type="button"
                onClick={() => setIsQrOpen(true)}
                title="Afficher le QR code d'adhésion"
                className="hover:bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              >
                <QrCode className="h-3.5 w-3.5" />
              </button>

              {/* Open page in new tab */}
              <a
                href={relativePath}
                target="_blank"
                rel="noopener noreferrer"
                title="Ouvrir la page client dans un nouvel onglet"
                className="hover:bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        }
      />

      {/* QR Code Quick Modal */}
      <Modal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        title="QR Code d'Adhésion Client"
        description="Vos clients scannent ce QR code pour installer leur carte fidélité directement dans leur téléphone."
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Link href="/qrcode">
              <Button variant="ghost" size="sm" className="text-xs">
                Personnaliser le chevalet
              </Button>
            </Link>
            <Button
              variant="default"
              size="sm"
              onClick={handleCopy}
              className="text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Lien copié !</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copier le lien</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="border-border flex h-52 w-52 items-center justify-center rounded-2xl border bg-white p-3 shadow-inner">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt={`QR code pour ${businessName || orgSlug}`}
                width={200}
                height={200}
                className="h-full w-full object-contain"
                unoptimized
              />
            ) : (
              <div className="text-muted-foreground text-xs font-medium">
                Génération du QR code...
              </div>
            )}
          </div>

          <p className="text-muted-foreground mt-4 max-w-sm font-mono text-xs">
            {getFullUrl()}
          </p>
        </div>
      </Modal>
    </>
  );
};
