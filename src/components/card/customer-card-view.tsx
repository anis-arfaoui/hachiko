"use client";

import {
  Check,
  Gift,
  Lock,
  MapPin,
  RefreshCw,
  Sparkles,
  Store,
} from "lucide-react";
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
  cardCreatedAt?: Date;
  customerCode?: string | null;
  customerName: string;
  locations?: {
    address: string | null;
    city: string | null;
    id: string;
    isDefault: boolean;
    name: string;
    phone: string | null;
  }[];
  logoUrl: string | null;
  programType?: string;
  rewards?: {
    cost: number;
    description: string | null;
    id: string;
    label: string;
  }[];
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
          <div className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-xs">
              {card.logoUrl ? (
                <Image
                  src={card.logoUrl}
                  alt={card.businessName}
                  fill
                  sizes="36px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Store className="h-4 w-4" />
              )}
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
            <div className="flex items-center gap-3">
              {card.logoUrl && (
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-white/20 shadow-xs">
                  <Image
                    src={card.logoUrl}
                    alt={card.businessName}
                    fill
                    sizes="40px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div>
                <span className="text-xs font-medium tracking-wider text-white/80 uppercase">
                  Carte de Fidélité
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  {card.businessName}
                </h3>
              </div>
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
            {card.customerCode && (
              <div className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-xs">
                <span className="text-[11px] font-medium text-white/80">
                  N° Client :
                </span>
                <span className="font-mono text-xs font-extrabold tracking-wider text-white">
                  {card.customerCode}
                </span>
              </div>
            )}
          </div>

          {/* Stamps or Points Section */}
          {card.programType === "points" ? (
            <div className="space-y-2 border-t border-white/20 pt-4">
              <div className="flex items-center justify-between text-xs font-medium text-white/90">
                <span>Progression des points</span>
                <span className="font-bold">
                  {card.balance} / {card.stampsRequired} pts
                </span>
              </div>

              {/* Points Progress Bar */}
              <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/20 p-0.5">
                <div
                  className="h-full rounded-full bg-white shadow-xs"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((card.balance / card.stampsRequired) * 100)
                    )}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs font-medium text-white/75">
                <span>0 pt</span>
                <span>
                  {Math.min(
                    100,
                    Math.round((card.balance / card.stampsRequired) * 100)
                  )}
                  %
                </span>
                <span>{card.stampsRequired} pts</span>
              </div>
            </div>
          ) : (
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
          )}

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
                {card.programType === "points"
                  ? `À débloquer à ${card.stampsRequired} points :`
                  : `À débloquer au ${card.stampsRequired}ème tampon :`}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-white">
                {card.rewardLabel}
              </p>
            </div>
          )}
        </div>

        {/* Mon Compte */}
        <div className="border-border bg-card space-y-2.5 rounded-2xl border p-4 text-xs shadow-xs">
          <div className="text-muted-foreground text-[10px] font-black tracking-wider uppercase">
            Mon Compte
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Code client</span>
            <span className="text-foreground font-mono text-xs font-bold">
              {card.customerCode || "—"}
            </span>
          </div>
          {card.cardCreatedAt && (
            <div className="border-border flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground text-xs">
                Membre depuis
              </span>
              <span className="text-foreground text-xs font-semibold capitalize">
                {new Date(card.cardCreatedAt).toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Info Note */}
        <p className="text-muted-foreground px-2 text-center text-[11px] leading-relaxed">
          Votre carte est mise à jour automatiquement après chaque visite chez{" "}
          <strong className="text-foreground">{card.businessName}</strong>.
        </p>

        {/* 🎁 VOS RÉCOMPENSES - CE QUE VOUS POUVEZ GAGNER (matching image 2) */}
        {card.rewards && card.rewards.length > 0 && (
          <div className="space-y-3.5 rounded-3xl bg-zinc-950 p-5 text-white shadow-xl">
            <div className="flex items-center gap-1.5 text-[11px] font-black tracking-widest text-zinc-400 uppercase">
              <Gift className="h-3.5 w-3.5" />
              <span>Vos récompenses</span>
            </div>

            <div>
              <h3 className="text-xl font-black tracking-tight uppercase sm:text-2xl">
                Ce que vous pouvez gagner
              </h3>

              {/* Dynamic prompt */}
              <p className="mt-0.5 text-xs font-semibold text-zinc-300">
                {(() => {
                  const nextLocked = card.rewards.find(
                    (r) => r.cost > card.balance
                  );
                  if (nextLocked) {
                    const diff = nextLocked.cost - card.balance;
                    let unit = "points";
                    if (card.programType !== "points") {
                      unit = diff > 1 ? "tampons" : "tampon";
                    }
                    return `Plus que ${diff} ${unit} pour ${nextLocked.label}`;
                  }
                  return "Vous avez débloqué toutes les récompenses ! 🎉";
                })()}
              </p>
            </div>

            {/* Reward Tiers List */}
            <div className="space-y-2 pt-1">
              {card.rewards.map((reward) => {
                const isUnlocked = card.balance >= reward.cost;
                return (
                  <div
                    key={reward.id}
                    className={cn(
                      "flex items-center justify-between rounded-2xl p-3 transition-all",
                      isUnlocked
                        ? "border border-amber-500/20 bg-zinc-900 shadow-xs"
                        : "bg-zinc-900/60 opacity-80"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all",
                          isUnlocked
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {isUnlocked ? (
                          <Check className="h-4 w-4 stroke-[3]" />
                        ) : (
                          <Lock className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 truncate">
                        <div
                          className={cn(
                            "truncate text-xs font-bold",
                            isUnlocked ? "text-white" : "text-zinc-200"
                          )}
                        >
                          {reward.label}
                        </div>
                        {reward.description && (
                          <div className="truncate text-[10px] text-zinc-400">
                            {reward.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={cn(
                        "shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs font-semibold",
                        isUnlocked
                          ? "border border-amber-500/20 bg-amber-500/10 text-amber-300"
                          : "bg-zinc-800 text-zinc-400"
                      )}
                    >
                      {reward.cost}{" "}
                      {card.programType === "points" ? "points" : "tampons"}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="pt-1 text-[11px] font-medium text-zinc-400">
              Présentez votre carte en caisse pour utiliser une récompense.
            </p>
          </div>
        )}

        {/* Store Locations / Nos adresses */}
        {card.locations && card.locations.length > 0 && (
          <div className="space-y-2 rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
              <MapPin className="text-primary h-3.5 w-3.5" />
              <span>Valable dans nos boutiques ({card.locations.length})</span>
            </div>
            <div className="space-y-2 pt-1">
              {card.locations.map((loc) => (
                <div
                  key={loc.id}
                  className="border-border bg-muted/40 rounded-2xl border p-2.5 text-xs"
                >
                  <div className="text-foreground flex items-center justify-between font-bold">
                    <span>{loc.name}</span>
                    {loc.isDefault && (
                      <span className="text-muted-foreground text-[10px]">
                        ⭐ Siège
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground mt-0.5 space-y-0.5 text-[11px]">
                    {loc.address && <p>📍 {loc.address}</p>}
                    {loc.city && <p>🏙️ {loc.city}</p>}
                    {loc.phone && <p>📞 {loc.phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
