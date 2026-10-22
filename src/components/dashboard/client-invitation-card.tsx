"use client";

import { Check, Copy, ExternalLink, QrCode, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ClientInvitationCardProps {
  businessName: string;
  orgSlug: string;
}

export const ClientInvitationCard = ({
  businessName,
  orgSlug,
}: ClientInvitationCardProps) => {
  const [copied, setCopied] = useState(false);
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
    let isActive = true;

    const generateQr = async () => {
      try {
        const url = await QRCode.toDataURL(getFullUrl(), {
          errorCorrectionLevel: "H",
          margin: 1,
          scale: 6,
          width: 240,
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
  }, [getFullUrl]);

  return (
    <Card className="border-primary/20 from-primary/5 via-card to-card overflow-hidden bg-gradient-to-br p-6 shadow-xs sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Info & Sharing */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="brand" size="sm" className="gap-1 font-semibold">
              <Sparkles className="h-3 w-3" />
              <span>Adhésion Client</span>
            </Badge>
          </div>

          <div>
            <h3 className="text-foreground text-lg font-bold sm:text-xl">
              Invitez vos clients à rejoindre votre programme
            </h3>
            <p className="text-muted-foreground mt-1.5 max-w-2xl text-xs leading-relaxed sm:text-sm">
              Affichez votre QR code en caisse ou partagez votre lien
              d&apos;inscription. Vos clients peuvent installer leur carte
              directement dans leur téléphone sans installer d&apos;application.
            </p>
          </div>

          {/* Copy link input bar */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="border-border bg-background flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 shadow-xs">
              <span className="text-muted-foreground text-xs font-semibold">
                URL :
              </span>
              <span className="text-foreground flex-1 truncate font-mono text-xs">
                {getFullUrl()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 text-xs font-semibold"
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

              <Link href="/qrcode">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 text-xs font-semibold"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Chevalet de caisse</span>
                </Button>
              </Link>

              <a
                href={relativePath}
                target="_blank"
                rel="noopener noreferrer"
                title="Tester l'expérience client"
              >
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Right: QR Preview Box */}
        <div className="flex shrink-0 flex-col items-center justify-center self-center lg:self-auto">
          <div className="border-border flex h-36 w-36 items-center justify-center rounded-2xl border bg-white p-2 shadow-sm sm:h-40 sm:w-40">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt={`QR code d'adhésion pour ${businessName}`}
                width={160}
                height={160}
                className="h-full w-full object-contain"
                unoptimized
              />
            ) : (
              <div className="text-muted-foreground text-[11px] font-medium">
                Chargement...
              </div>
            )}
          </div>
          <span className="text-muted-foreground mt-2 text-[11px] font-medium">
            Scannez pour tester
          </span>
        </div>
      </div>
    </Card>
  );
};
