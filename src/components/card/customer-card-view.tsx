"use client";

import { Check, Gift, RefreshCw, Sparkles, Store } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

import { getCardDetailsAction } from "@/app/actions/customer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  { bgClass: "bg-zinc-900", value: "#18181b" },
  { bgClass: "bg-amber-700", value: "#b45309" },
  { bgClass: "bg-emerald-600", value: "#059669" },
  { bgClass: "bg-blue-600", value: "#2563eb" },
  { bgClass: "bg-rose-900", value: "#881337" },
  { bgClass: "bg-indigo-700", value: "#4338ca" },
] as const;

const getPresetBgClass = (colorValue: string): string => {
  const match = COLOR_PRESETS.find((p) => p.value === colorValue);
  return match?.bgClass ?? "bg-zinc-900";
};

const stampKey = (idx: number): string => `customer-stamp-${idx}`;

interface CardDetailsState {
  balance: number;
  brandColor: string;
  businessName: string;
  customerName: string;
  logoUrl: string | null;
  rewardLabel: string;
  stampsRequired: number;
  token: string;
}

interface CustomerCardViewProps {
  token: string;
}

export const CustomerCardView = ({ token }: CustomerCardViewProps) => {
  const [card, setCard] = useState<CardDetailsState | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchCard = useCallback(async () => {
    if (!token) {
      return;
    }
    setIsRefreshing(true);
    try {
      const data = await getCardDetailsAction(token);
      if (data) {
        setCard(data);
      } else {
        setNotFound(true);
      }
    } catch {
      // network hiccup
    }
    setIsRefreshing(false);
  }, [token]);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        const data = await getCardDetailsAction(token);
        if (isActive) {
          if (data) {
            setCard(data);
          } else {
            setNotFound(true);
          }
        }
      } catch {
        // network hiccup
      }
    };

    loadData();

    const interval = setInterval(async () => {
      try {
        const data = await getCardDetailsAction(token);
        if (isActive && data) {
          setCard(data);
        }
      } catch {
        // network hiccup
      }
    }, 5000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [token]);

  // Generate QR code with secret token
  useEffect(() => {
    if (!token) {
      return;
    }

    const generateQr = async () => {
      try {
        const url = await QRCode.toDataURL(token, {
          errorCorrectionLevel: "H",
          margin: 1,
          scale: 8,
          width: 260,
        });
        setQrCodeDataUrl(url);
      } catch {
        setQrCodeDataUrl(null);
      }
    };

    generateQr();
  }, [token]);

  if (notFound) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Carte introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Cette carte de fidélité n&apos;existe pas ou a été révoquée.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground text-sm">
            Chargement de votre carte...
          </p>
        </div>
      </div>
    );
  }

  const isRewardReady = card.balance >= card.stampsRequired;

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">
        {/* Top Shop Info */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-foreground text-sm leading-tight font-bold">
                {card.businessName}
              </h2>
              <p className="text-muted-foreground text-xs">
                Client : {card.customerName}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={fetchCard}
            disabled={isRefreshing}
            title="Rafraîchir"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </div>

        {/* Loyalty Card Element */}
        <div
          className={cn(
            "overflow-hidden rounded-3xl p-6 text-white shadow-xl transition-colors",
            getPresetBgClass(card.brandColor)
          )}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-white/20 pb-4">
            <div>
              <span className="text-xs font-medium tracking-wider text-white/80 uppercase">
                Carte de Fidélité
              </span>
              <h3 className="text-xl font-extrabold text-white">
                {card.businessName}
              </h3>
            </div>
            <Gift className="h-7 w-7 text-white/90" />
          </div>

          {/* QR Code Container */}
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="rounded-2xl bg-white p-3 shadow-lg">
              {qrCodeDataUrl ? (
                <Image
                  src={qrCodeDataUrl}
                  alt="QR Code de fidélité"
                  width={200}
                  height={200}
                  unoptimized
                  priority
                  className="rounded-xl"
                />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center text-xs text-black">
                  Génération...
                </div>
              )}
            </div>
            <p className="mt-2.5 text-center text-xs font-medium text-white/80">
              Présentez ce QR code à la caisse
            </p>
          </div>

          {/* Stamp Grid */}
          <div className="space-y-2 border-t border-white/20 pt-4">
            <div className="flex items-center justify-between text-xs font-medium text-white/90">
              <span>Progression des tampons</span>
              <span className="font-bold">
                {card.balance} / {card.stampsRequired}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-1">
              {Array.from({ length: card.stampsRequired }).map((_, idx) => {
                const isCollected = idx < card.balance;
                return (
                  <div
                    key={stampKey(idx)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-full text-xs font-bold transition-colors",
                      isCollected
                        ? "scale-105 bg-white text-black shadow-md"
                        : "border-2 border-dashed border-white/40 text-white/60"
                    )}
                  >
                    {isCollected ? (
                      <Check className="h-4 w-4 stroke-2" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reward Ready Celebration */}
          {isRewardReady ? (
            <div className="mt-5 animate-pulse rounded-2xl bg-white p-3.5 text-center text-black shadow-md">
              <div className="text-primary inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                <Sparkles className="h-4 w-4" />
                <span>Cadeau Débloqué !</span>
              </div>
              <p className="text-foreground mt-0.5 text-sm font-extrabold">
                {card.rewardLabel}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Montrez ce code à la caisse pour recevoir votre récompense.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-white/15 p-2.5 text-center">
              <p className="text-xs font-medium tracking-wider text-white/80 uppercase">
                À débloquer au {card.stampsRequired}ème tampon :
              </p>
              <p className="mt-0.5 text-xs font-semibold text-white">
                {card.rewardLabel}
              </p>
            </div>
          )}
        </div>

        {/* PWA / Home screen tip */}
        <div className="border-border bg-card text-muted-foreground rounded-xl border p-3 text-center text-xs shadow-sm">
          💡 <strong>Astuce :</strong> Ajoutez cette page à votre écran
          d&apos;accueil pour y accéder en un clic sans installer
          d&apos;application.
        </div>
      </div>
    </div>
  );
};
