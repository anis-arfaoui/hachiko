"use client";

import {
  Bell,
  Check,
  Copy,
  Gift,
  Lock,
  RefreshCw,
  Share2,
  Sparkles,
  Store,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

import { getCardDetailsAction } from "@/app/actions/customer";
import { WalletButtons } from "@/components/card/wallet-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

const stampKey = (idx: number): string => `customer-stamp-${idx}`;

interface CardDetailsState {
  balance: number;
  bgImageUrl?: string | null;
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
  const [notificationStatus, setNotificationStatus] = useState<
    "idle" | "granted" | "denied"
  >("idle");
  const [copied, setCopied] = useState(false);

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

  const handleEnableNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationStatus(permission === "granted" ? "granted" : "denied");
      } catch {
        setNotificationStatus("granted");
      }
    } else {
      setNotificationStatus("granted");
    }
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch {
      // Clipboard write failed
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") {
      return;
    }
    const shareData = {
      text: `Rejoignez le programme de fidélité de ${card?.businessName || "notre commerce"} et découvrez vos avantages exclusifs !`,
      title: card?.businessName || "Carte de fidélité",
      url: window.location.href,
    };

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData);
      } catch {
        // User canceled or share failed
      }
    } else {
      await handleCopyLink();
    }
  };

  if (notFound) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Carte introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="muted">
              Cette carte de fidélité n&apos;existe pas ou a été révoquée.
            </Text>
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
          <Text variant="muted">Chargement de votre carte...</Text>
        </div>
      </div>
    );
  }

  const isRewardReady = card.balance >= card.stampsRequired;
  const isPointsProgram = card.programType === "points";
  const progressPercent = Math.min(
    100,
    Math.round((card.balance / card.stampsRequired) * 100)
  );

  const sortedRewards = card.rewards
    ? card.rewards.toSorted((a, b) => a.cost - b.cost)
    : [];

  return (
    <div className="bg-background selection:bg-primary/20 relative min-h-screen overflow-x-hidden">
      {/* Subtle ambient lighting */}
      <div
        className="pointer-events-none fixed inset-0 flex justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="bg-primary/5 h-[400px] w-full max-w-lg rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-6 sm:max-w-md sm:py-10">
        <div className="space-y-4 sm:space-y-5">
          {/* 1. Top Header */}
          <div className="flex flex-col items-center space-y-1 text-center">
            <span className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase">
              Carte de fidélité
            </span>
            <div className="flex items-center justify-center gap-2">
              <Heading
                level={1}
                className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl"
              >
                {card.businessName}
              </Heading>
              <button
                type="button"
                onClick={fetchCard}
                disabled={isRefreshing}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-1.5 transition-all active:scale-95"
                title="Rafraîchir la carte"
                aria-label="Rafraîchir"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    isRefreshing && "text-primary animate-spin"
                  )}
                />
              </button>
            </div>
            {card.customerName && (
              <Text variant="small" className="text-muted-foreground">
                Client :{" "}
                <span className="text-foreground font-semibold">
                  {card.customerName}
                </span>
              </Text>
            )}
          </div>

          {/* 2. The Main Pass Card */}
          <div
            style={{ backgroundColor: card.brandColor || "#18181b" }}
            className="relative overflow-hidden rounded-3xl p-5 text-white shadow-2xl transition-all sm:rounded-[28px] sm:p-6"
          >
            {/* Optional background banner image overlay */}
            {card.bgImageUrl && (
              <div
                className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-35 mix-blend-overlay transition-opacity"
                style={{ backgroundImage: `url(${card.bgImageUrl})` }}
                aria-hidden="true"
              />
            )}

            {/* Subtle sheen and pattern overlay for realistic wallet pass texture */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/35"
              aria-hidden="true"
            />

            {/* Decorative Apple Wallet style watermarks / circles */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10 blur-xs" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-xs" />

            <div className="relative z-10 flex flex-col space-y-5">
              {/* Card Header: Store logo & name + Pill badge */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white/20 shadow-xs backdrop-blur-xs sm:h-12 sm:w-12">
                    {card.logoUrl ? (
                      <Image
                        src={card.logoUrl}
                        alt={card.businessName}
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Store className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading truncate text-lg leading-tight font-bold tracking-tight text-white sm:text-xl">
                      {card.businessName}
                    </h2>
                    <p className="text-xs font-medium text-white/80">
                      Programme fidélité
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-semibold text-white/95 shadow-xs backdrop-blur-sm">
                  {isPointsProgram ? "Points" : "Tampons"}
                </span>
              </div>

              {/* Card Body: Points vs Stamps */}
              {isPointsProgram ? (
                <div>
                  <div className="font-heading text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                    {card.balance}
                  </div>
                  <div className="mt-1 text-sm font-medium text-white/85">
                    points • objectif {card.stampsRequired}
                  </div>

                  {/* Smooth Progress Bar */}
                  <div className="mt-3 h-3.5 w-full overflow-hidden rounded-full bg-white/20 p-0.5 backdrop-blur-xs">
                    <div
                      className="h-full rounded-full bg-white shadow-xs transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-white/90">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-white" />
                    <span className="truncate">{card.rewardLabel}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/90">
                    <span>Progression des tampons</span>
                    <span className="font-bold">
                      {card.balance} / {card.stampsRequired}
                    </span>
                  </div>

                  {/* Stamp grid with sleek rounded circles */}
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {Array.from({ length: card.stampsRequired }).map(
                      (_, idx) => {
                        const isCollected = idx < card.balance;
                        return (
                          <div
                            key={stampKey(idx)}
                            className={cn(
                              "flex aspect-square items-center justify-center rounded-full text-xs font-bold transition-all",
                              isCollected
                                ? "scale-105 bg-white text-zinc-900 shadow-md"
                                : "border-2 border-dashed border-white/40 text-white/70"
                            )}
                          >
                            {isCollected ? (
                              <Check className="h-4 w-4 stroke-[2.5]" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-white/90">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-white" />
                    <span className="truncate">{card.rewardLabel}</span>
                  </div>
                </div>
              )}

              {/* Bottom Row: Left Member Since & Code, Right White QR Code */}
              <div className="flex items-end justify-between gap-3 border-t border-white/20 pt-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium tracking-wide text-white/75 uppercase">
                    Membre depuis
                  </span>
                  <div className="text-sm leading-tight font-bold text-white capitalize">
                    {card.cardCreatedAt
                      ? new Date(card.cardCreatedAt).toLocaleDateString(
                          "fr-FR",
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "—"}
                  </div>
                  {card.customerCode && (
                    <div className="mt-2 inline-block rounded-lg border border-white/15 bg-white/15 px-2.5 py-1 font-mono text-xs font-extrabold tracking-wider text-white backdrop-blur-xs sm:text-sm">
                      {card.customerCode}
                    </div>
                  )}
                </div>

                {/* High-contrast white rounded box containing the QR code */}
                <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-white p-2 shadow-lg sm:p-2.5">
                  {qrCodeDataUrl ? (
                    <Image
                      src={qrCodeDataUrl}
                      alt="QR Code de fidélité"
                      width={112}
                      height={112}
                      unoptimized
                      priority
                      className="aspect-square rounded-lg"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center text-xs text-zinc-500">
                      Génération...
                    </div>
                  )}
                  <span className="mt-1 text-center text-[9px] font-bold tracking-wider text-zinc-600 uppercase">
                    À scanner en caisse
                  </span>
                </div>
              </div>

              {/* Celebration Banner when reward is unlocked */}
              {isRewardReady && (
                <div className="animate-pulse rounded-2xl bg-white p-3.5 text-center text-zinc-950 shadow-md">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-emerald-600 uppercase">
                    <Sparkles className="h-4 w-4" />
                    <span>Récompense Débloquée !</span>
                  </div>
                  <p className="mt-0.5 text-sm font-extrabold text-zinc-900">
                    {card.rewardLabel}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Présentez ce QR code à la caisse pour recevoir votre cadeau.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Notification Opt-In Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-white shadow-xl">
            <div className="flex items-center gap-1.5 text-[11px] font-black tracking-widest text-zinc-400 uppercase">
              <Bell className="h-3.5 w-3.5" />
              <span>Notifications</span>
            </div>
            <Heading
              level={3}
              className="mt-1 text-xl font-black tracking-tight text-white uppercase sm:text-2xl"
            >
              Ne ratez aucune offre
            </Heading>
            <p className="mt-1 text-xs leading-relaxed text-zinc-300 sm:text-sm">
              Promotions, récompenses débloquées, invitations : recevez tout
              directement sur votre téléphone.
            </p>
            <Button
              type="button"
              onClick={handleEnableNotifications}
              className={cn(
                "mt-4 flex h-auto w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-sm transition-all",
                notificationStatus === "granted"
                  ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  : "bg-white text-zinc-950 hover:bg-zinc-100"
              )}
            >
              <Bell className="h-4 w-4" />
              <span>
                {notificationStatus === "granted"
                  ? "Notifications activées !"
                  : "Activer les notifications"}
              </span>
            </Button>
          </div>

          {/* 4. Wallet Passes Section */}
          <WalletButtons brandColor={card.brandColor} token={card.token} />

          {/* 5. "Mon Compte" Card */}
          <Card className="border-border bg-card space-y-3 rounded-3xl p-5 shadow-xs">
            <div className="text-muted-foreground text-[11px] font-black tracking-widest uppercase">
              Mon Compte
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Code client</span>
                <span className="text-foreground font-mono font-extrabold tracking-wider">
                  {card.customerCode || "—"}
                </span>
              </div>
              {card.cardCreatedAt && (
                <div className="border-border flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground">Membre depuis</span>
                  <span className="text-foreground font-semibold capitalize">
                    {new Date(card.cardCreatedAt).toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Automatic Update Note & Walaa Branding */}
          <div className="space-y-2 pt-1 text-center">
            <p className="text-muted-foreground px-3 text-[11px] leading-relaxed">
              Votre carte est mise à jour automatiquement après chaque visite
              chez{" "}
              <strong className="text-foreground">{card.businessName}</strong>.
            </p>
            <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
              <span>Propulsé par</span>
              <span className="text-foreground inline-flex items-center gap-1 font-bold">
                <span className="bg-primary flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-black text-white">
                  W
                </span>
                <span>Walaa</span>
              </span>
            </div>
          </div>

          {/* 6. "Vos Récompenses - Ce que vous pouvez gagner" */}
          {sortedRewards.length > 0 && (
            <div className="space-y-3.5 rounded-3xl border border-zinc-900 bg-zinc-950 p-5 text-white shadow-xl">
              <div className="flex items-center gap-1.5 text-[11px] font-black tracking-widest text-zinc-400 uppercase">
                <Gift className="h-3.5 w-3.5" />
                <span>Vos récompenses</span>
              </div>

              <div>
                <Heading
                  level={3}
                  className="text-xl font-black tracking-tight text-white uppercase sm:text-2xl"
                >
                  Ce que vous pouvez gagner
                </Heading>

                {/* Dynamic prompt */}
                <p className="mt-0.5 text-xs font-semibold text-zinc-300">
                  {(() => {
                    const nextLocked = sortedRewards.find(
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

              {/* Rewards List */}
              <div className="space-y-2 pt-1">
                {sortedRewards.map((reward) => {
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

          {/* 7. "Parrainage : Invitez un ami" */}
          <div className="space-y-2">
            <div className="text-muted-foreground text-center text-[11px] font-bold tracking-widest uppercase">
              Gagnez plus de récompenses
            </div>
            <div
              style={{ backgroundColor: card.brandColor || "#18181b" }}
              className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl transition-all"
            >
              {/* Decorative translucent circles matching card physics */}
              <div
                className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/10 blur-xs"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-black/15 blur-xs"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/25"
                aria-hidden="true"
              />

              <div className="relative z-10">
                <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-white/80 uppercase">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs">
                    <Gift className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span>Parrainage</span>
                </div>
                <Heading
                  level={3}
                  className="mt-2 text-xl font-black tracking-tight text-white uppercase sm:text-2xl"
                >
                  Invitez un ami
                </Heading>
                <p className="mt-1 text-xs text-white/90">
                  Partagez votre carte de fidélité {card.businessName}.
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    style={{ color: card.brandColor || "#18181b" }}
                    className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 text-xs font-bold shadow-md transition-all hover:bg-white/90 active:scale-[0.98] sm:text-sm"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Partager mon invitation</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-white/20 text-white shadow-xs backdrop-blur-xs transition-all hover:bg-white/30 active:scale-[0.95]"
                    title={copied ? "Lien copié !" : "Copier le lien"}
                    aria-label="Copier le lien d'invitation"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {copied && (
                  <p className="mt-2 text-center text-[11px] font-bold text-white">
                    ✓ Lien d&apos;invitation copié dans le presse-papier !
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
