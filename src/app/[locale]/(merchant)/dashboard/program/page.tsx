"use client";

import {
  Apple,
  CakeSlice,
  Car,
  Check,
  CircleDot,
  Coffee,
  ExternalLink,
  Flame,
  Gem,
  Gift,
  Heart,
  Leaf,
  MessageCircle,
  Pizza,
  Save,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Star,
  Utensils,
  Wrench,
  Zap,
} from "lucide-react";
import type { ElementType } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  getProgramAndOrgDetailsAction,
  saveProgramLogicAction,
} from "@/app/actions/program";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface StampIconOption {
  icon: ElementType;
  id: string;
}

const STAMP_ICONS: StampIconOption[] = [
  { icon: Check, id: "check" },
  { icon: Heart, id: "heart" },
  { icon: Star, id: "star" },
  { icon: Coffee, id: "coffee" },
  { icon: Utensils, id: "utensils" },
  { icon: Pizza, id: "pizza" },
  { icon: CakeSlice, id: "cake" },
  { icon: Scissors, id: "scissors" },
  { icon: Sparkles, id: "sparkles" },
  { icon: CircleDot, id: "fan" },
  { icon: Gift, id: "gift" },
  { icon: Flame, id: "flame" },
  { icon: Leaf, id: "leaf" },
  { icon: ShoppingBag, id: "bag" },
  { icon: Shirt, id: "shirt" },
  { icon: Gem, id: "gem" },
  { icon: Wrench, id: "wrench" },
  { icon: Car, id: "car" },
  { icon: Apple, id: "carrot" },
  { icon: ShoppingBasket, id: "basket" },
  { icon: Smartphone, id: "phone" },
];

const STAMP_PRESETS = [5, 6, 8, 10, 12, 15];

const ProgramSettingsPage = () => {
  const [programType, setProgramType] = useState<"stamps" | "points">("stamps");
  const [stampsInput, setStampsInput] = useState<string>("10");
  const [pointsRequiredInput, setPointsRequiredInput] = useState<string>("100");
  const [rewardLabel, setRewardLabel] = useState("1 Récompense offerte");
  const [stampIcon, setStampIcon] = useState("check");

  // Points specific settings (string states to allow clearing without trapping at 0)
  const [pointsPerSpendInput, setPointsPerSpendInput] = useState<string>("1");
  const [minSpendInput, setMinSpendInput] = useState<string>("10");
  const [pointsExpiryDaysInput, setPointsExpiryDaysInput] =
    useState<string>("");

  // Parrainage
  const [referralBonusInput, setReferralBonusInput] = useState<string>("0");

  // Avis Google
  const [googleReviewEnabled, setGoogleReviewEnabled] = useState(false);
  const [googleReviewBonusInput, setGoogleReviewBonusInput] =
    useState<string>("0");
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    "https://search.google.com/local/writereview?placeid="
  );

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  // Parsing & validation logic matching onboarding rules
  const parsedStamps = Math.trunc(Number(stampsInput.trim()));
  const isStampsValid =
    !Number.isNaN(parsedStamps) && parsedStamps >= 2 && parsedStamps <= 30;
  const effectiveStamps = isStampsValid ? parsedStamps : 10;

  const parsedPointsRequired = Math.trunc(Number(pointsRequiredInput.trim()));
  const isPointsValid =
    !Number.isNaN(parsedPointsRequired) &&
    parsedPointsRequired >= 5 &&
    parsedPointsRequired <= 5000;
  const effectivePoints = isPointsValid ? parsedPointsRequired : 100;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await getProgramAndOrgDetailsAction();
        if (data && isMounted) {
          if (data.program) {
            setProgramType(
              data.program.type === "points" ? "points" : "stamps"
            );
            if (data.program.type === "points") {
              setPointsRequiredInput(String(data.program.stampsRequired));
            } else {
              setStampsInput(String(data.program.stampsRequired));
            }
            setRewardLabel(data.program.rewardLabel);
          }
          const meta = data.org.metadata;
          if (meta.stampIcon) {
            setStampIcon(meta.stampIcon);
          }
          if (meta.referralBonus !== undefined) {
            setReferralBonusInput(String(meta.referralBonus));
          }
          if (meta.googleReviewEnabled !== undefined) {
            setGoogleReviewEnabled(meta.googleReviewEnabled);
          }
          if (meta.googleReviewBonus !== undefined) {
            setGoogleReviewBonusInput(String(meta.googleReviewBonus));
          }
          if (meta.googleReviewUrl) {
            setGoogleReviewUrl(meta.googleReviewUrl);
          }
          if (meta.pointsPerSpend !== undefined) {
            setPointsPerSpendInput(String(meta.pointsPerSpend));
          }
          if (meta.minSpend !== undefined) {
            setMinSpendInput(String(meta.minSpend));
          }
          if (
            meta.pointsExpiryDays !== undefined &&
            meta.pointsExpiryDays > 0
          ) {
            setPointsExpiryDaysInput(String(meta.pointsExpiryDays));
          } else {
            setPointsExpiryDaysInput("");
          }
        }
      } catch {
        // Ignore fetch errors
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Selected Stamp Icon Component
  const SelectedStampIconComponent = useMemo(() => {
    const found = STAMP_ICONS.find((item) => item.id === stampIcon);
    return found ? found.icon : Check;
  }, [stampIcon]);

  const handleSave = async () => {
    if (programType === "stamps" && !isStampsValid) {
      setSaveMessage({
        text: "Le nombre de tampons doit être compris entre 2 et 30.",
        type: "error",
      });
      return;
    }
    if (programType === "points" && !isPointsValid) {
      setSaveMessage({
        text: "Veuillez renseigner un objectif de points valide (au moins 5 points).",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const parsedPointsPerSpend = Math.max(
      1,
      Math.trunc(Number(pointsPerSpendInput.trim())) || 1
    );
    const parsedMinSpend = Math.max(
      0,
      Math.trunc(Number(minSpendInput.trim())) || 0
    );
    const parsedPointsExpiryDays =
      pointsExpiryDaysInput.trim() === ""
        ? 0
        : Math.max(
            0,
            Math.min(
              3650,
              Math.trunc(Number(pointsExpiryDaysInput.trim())) || 0
            )
          );
    const parsedReferralBonus = Math.max(
      0,
      Math.trunc(Number(referralBonusInput.trim())) || 0
    );
    const parsedGoogleReviewBonus = Math.max(
      0,
      Math.trunc(Number(googleReviewBonusInput.trim())) || 0
    );

    const finalTarget =
      programType === "points" ? effectivePoints : effectiveStamps;

    const res = await saveProgramLogicAction({
      googleReviewBonus: parsedGoogleReviewBonus,
      googleReviewEnabled,
      googleReviewUrl,
      minSpend: parsedMinSpend,
      pointsExpiryDays: parsedPointsExpiryDays,
      pointsPerSpend: parsedPointsPerSpend,
      referralBonus: parsedReferralBonus,
      rewardLabel,
      stampIcon,
      stampsRequired: finalTarget,
      type: programType,
    });

    if (res.success) {
      setSaveMessage({
        text: "Configuration enregistrée avec succès !",
        type: "success",
      });
    } else {
      setSaveMessage({
        text: "Erreur lors de l'enregistrement de la configuration.",
        type: "error",
      });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          <span>Chargement du programme...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-foreground text-3xl font-black tracking-tight uppercase">
            Programme
          </h1>
          <div className="border-border bg-card inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 shadow-xs">
            {programType === "points" ? (
              <>
                <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span className="text-foreground text-xs font-bold">
                  Programme à points
                </span>
              </>
            ) : (
              <>
                <span className="text-sm leading-none">🪪</span>
                <span className="text-foreground text-xs font-bold">
                  Carte à tampons
                </span>
              </>
            )}
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
              Actif
            </span>
          </div>
        </div>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {programType === "points"
            ? "Configurez le barème de points et la récompense de votre établissement. Le programme est fixe et adapté à votre modèle économique."
            : "Configurez le nombre de tampons et la récompense de votre carte fidélité. Le programme est fixe et adapté à votre modèle économique."}
        </p>
      </div>

      {saveMessage && (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm font-semibold shadow-xs",
            saveMessage.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          )}
        >
          {saveMessage.text}
        </div>
      )}

      {/* 1. Configuration Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {programType === "stamps" ? (
                <span className="text-lg">🪪</span>
              ) : (
                <Zap className="text-foreground h-5 w-5" />
              )}
              <CardTitle className="text-base font-bold">
                {programType === "points"
                  ? "Configuration du système à points"
                  : "Configuration de la carte à tampons"}
              </CardTitle>
            </div>
            <span className="text-muted-foreground text-xs font-medium">
              Programme unique à votre compte
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {programType === "stamps" ? (
            <>
              {/* Nombre de tampons par carte */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="stampsInput"
                    className="text-foreground text-xs font-bold"
                  >
                    Nombre de tampons par carte
                  </Label>
                  <span className="text-muted-foreground text-xs font-semibold">
                    {isStampsValid
                      ? `${parsedStamps} tampons`
                      : "2 à 30 tampons"}
                  </span>
                </div>
                <div className="-mx-1.5 -my-2 flex items-center gap-2 overflow-x-auto px-1.5 py-2 sm:gap-2.5">
                  {STAMP_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStampsInput(String(preset))}
                      className={cn(
                        "focus-visible:ring-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-all focus-visible:ring-2 focus-visible:outline-none",
                        parsedStamps === preset
                          ? "border-foreground bg-foreground text-background shadow-xs"
                          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                  <Input
                    id="stampsInput"
                    type="number"
                    min={2}
                    max={30}
                    value={stampsInput}
                    onChange={(e) => setStampsInput(e.target.value)}
                    onBlur={() => {
                      const val = Math.trunc(Number(stampsInput.trim()));
                      if (Number.isNaN(val) || val < 2) {
                        setStampsInput("2");
                      } else if (val > 30) {
                        setStampsInput("30");
                      } else {
                        setStampsInput(String(val));
                      }
                    }}
                    placeholder="Autre"
                    containerClassName="w-16 shrink-0"
                    className="h-11 w-16 rounded-xl text-center font-bold"
                  />
                </div>
                {!isStampsValid && stampsInput.trim() !== "" && (
                  <p className="text-destructive text-xs">
                    Le nombre de tampons doit être compris entre 2 et 30.
                  </p>
                )}
              </div>

              {/* Dark Aperçu Box */}
              <div className="rounded-2xl bg-zinc-950 p-5 text-white shadow-inner">
                <div className="mb-4 text-xs font-black tracking-widest text-zinc-400 uppercase">
                  Aperçu &mdash; {effectiveStamps} Tampons
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {Array.from({
                    length: Math.min(effectiveStamps, 12),
                  }).map((_, idx) => {
                    const isCollected =
                      idx < Math.max(1, Math.min(3, effectiveStamps - 1));
                    return (
                      <div
                        key={`preview-stamp-${idx}`}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all",
                          isCollected
                            ? "bg-white text-zinc-950 shadow-xs"
                            : "border-2 border-zinc-700 bg-zinc-900/40 text-zinc-600"
                        )}
                      >
                        {isCollected ? (
                          <SelectedStampIconComponent className="h-5 w-5 stroke-[2.5]" />
                        ) : null}
                      </div>
                    );
                  })}
                  {effectiveStamps > 12 && (
                    <span className="text-xs font-semibold text-zinc-400">
                      +{effectiveStamps - 12} autres
                    </span>
                  )}
                </div>
                <p className="mt-4 text-xs font-medium text-zinc-400">
                  {Math.max(1, Math.min(3, effectiveStamps - 1))}/
                  {effectiveStamps} tampons collectés &rarr; récompense proche !
                </p>
              </div>

              {/* Icône du tampon */}
              <div className="space-y-2.5">
                <Label className="text-foreground text-xs font-bold">
                  Icône du tampon
                </Label>
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
                  {STAMP_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = stampIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setStampIcon(item.id)}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-xl border p-2 transition-all",
                          isSelected
                            ? "border-foreground bg-foreground/10 text-foreground ring-foreground/20 ring-2"
                            : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <IconComp className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
                <p className="text-muted-foreground text-xs">
                  Affichée sur les tampons acquis &mdash; carte web, Apple
                  Wallet et Google Wallet.
                </p>
              </div>

              {/* Description de la récompense */}
              <div className="space-y-2">
                <Label
                  htmlFor="rewardLabelStamps"
                  className="text-foreground text-xs font-bold"
                >
                  Description de la récompense
                </Label>
                <Input
                  id="rewardLabelStamps"
                  value={rewardLabel}
                  onChange={(e) => setRewardLabel(e.target.value)}
                  placeholder="Ex: 1 Café ou Thé offert"
                  className="h-11"
                  required
                />
              </div>
            </>
          ) : (
            <>
              {/* Système à Points Configuration */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="pointsPerSpend"
                    className="text-foreground text-xs font-bold"
                  >
                    Points par 10 DA dépensés
                  </Label>
                  <Input
                    id="pointsPerSpend"
                    type="number"
                    min={1}
                    max={100}
                    value={pointsPerSpendInput}
                    onChange={(e) => setPointsPerSpendInput(e.target.value)}
                    className="h-11"
                    placeholder="1"
                  />
                  <p className="text-muted-foreground text-xs">
                    C&apos;est votre barème. Il se règle par tranche de 10 DA.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="minSpend"
                    className="text-foreground text-xs font-bold"
                  >
                    Achat minimum (DA)
                  </Label>
                  <Input
                    id="minSpend"
                    type="number"
                    min={0}
                    step={10}
                    value={minSpendInput}
                    onChange={(e) => setMinSpendInput(e.target.value)}
                    className="h-11"
                    placeholder="0"
                  />
                  <p className="text-muted-foreground text-xs">
                    En dessous, aucun point n&apos;est crédité.
                  </p>
                </div>
              </div>

              {/* Points nécessaires pour la récompense */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="pointsRequired"
                    className="text-foreground text-xs font-bold"
                  >
                    Points nécessaires pour la récompense
                  </Label>
                  <span className="text-muted-foreground text-xs font-semibold">
                    {isPointsValid
                      ? `${parsedPointsRequired} points`
                      : "5 à 5000 points"}
                  </span>
                </div>
                <Input
                  id="pointsRequired"
                  type="number"
                  min={5}
                  max={5000}
                  step={10}
                  value={pointsRequiredInput}
                  onChange={(e) => setPointsRequiredInput(e.target.value)}
                  onBlur={() => {
                    const val = Math.trunc(Number(pointsRequiredInput.trim()));
                    if (Number.isNaN(val) || val < 5) {
                      setPointsRequiredInput("5");
                    } else if (val > 5000) {
                      setPointsRequiredInput("5000");
                    } else {
                      setPointsRequiredInput(String(val));
                    }
                  }}
                  className="h-11"
                />
                {!isPointsValid && pointsRequiredInput.trim() !== "" && (
                  <p className="text-destructive text-xs">
                    L&apos;objectif de points doit être compris entre 5 et 5
                    000.
                  </p>
                )}
              </div>

              {/* Expiration des points */}
              <div className="space-y-2">
                <Label
                  htmlFor="pointsExpiryDays"
                  className="text-foreground text-xs font-bold"
                >
                  Expiration des points (jours, 0 = jamais)
                </Label>
                <Input
                  id="pointsExpiryDays"
                  type="number"
                  min={0}
                  max={3650}
                  value={pointsExpiryDaysInput}
                  onChange={(e) => setPointsExpiryDaysInput(e.target.value)}
                  className="h-11"
                  placeholder="0"
                />
              </div>

              {/* Description de la récompense */}
              <div className="space-y-2">
                <Label
                  htmlFor="rewardLabelPoints"
                  className="text-foreground text-xs font-bold"
                >
                  Description de la récompense
                </Label>
                <Input
                  id="rewardLabelPoints"
                  value={rewardLabel}
                  onChange={(e) => setRewardLabel(e.target.value)}
                  placeholder="Ex: remise de 15%"
                  className="h-11"
                  required
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 2. Parrainage Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <div className="flex items-center gap-2">
            <Gift className="text-foreground h-5 w-5" />
            <CardTitle className="text-base font-bold">Parrainage</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          <Label
            htmlFor="referralBonus"
            className="text-foreground text-xs font-bold"
          >
            Bonus de parrainage (
            {programType === "points" ? "points" : "tampons"})
          </Label>
          <Input
            id="referralBonus"
            type="number"
            min={0}
            max={programType === "points" ? 1000 : 10}
            value={referralBonusInput}
            onChange={(e) => setReferralBonusInput(e.target.value)}
            className="h-11"
            placeholder="0"
          />
          <p className="text-muted-foreground text-xs">
            Quand un client invite un ami,{" "}
            <span className="text-foreground font-semibold">les deux</span>{" "}
            reçoivent ce bonus à l&apos;inscription. Mettez 0 pour désactiver le
            parrainage.
          </p>
        </CardContent>
      </Card>

      {/* 3. Bonus avis Google Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base font-bold">
              Bonus avis Google
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {/* Checkbox */}
          <div className="flex items-center space-x-2.5">
            <input
              type="checkbox"
              id="googleReviewEnabled"
              checked={googleReviewEnabled}
              onChange={(e) => setGoogleReviewEnabled(e.target.checked)}
              className="border-border text-primary h-4 w-4 cursor-pointer rounded"
            />
            <Label
              htmlFor="googleReviewEnabled"
              className="text-foreground cursor-pointer text-sm font-semibold"
            >
              Activer le bonus avis Google
            </Label>
          </div>

          {/* Bonus accordé */}
          <div className="space-y-2">
            <Label
              htmlFor="googleReviewBonus"
              className="text-foreground text-xs font-bold"
            >
              Bonus accordé ({programType === "points" ? "points" : "tampons"})
            </Label>
            <Input
              id="googleReviewBonus"
              type="number"
              min={0}
              max={programType === "points" ? 500 : 5}
              value={googleReviewBonusInput}
              onChange={(e) => setGoogleReviewBonusInput(e.target.value)}
              className="h-11"
              placeholder="0"
            />
          </div>

          {/* Lien Google Review */}
          <div className="space-y-2">
            <Label
              htmlFor="googleReviewUrl"
              className="text-foreground text-xs font-bold"
            >
              Lien de votre page d&apos;avis Google
            </Label>
            <Input
              id="googleReviewUrl"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://search.google.com/local/writereview?placeid="
              className="h-11 font-mono text-xs"
            />
            <p className="text-muted-foreground text-xs">
              Collez votre <span className="font-bold">Place ID</span> à la fin
              du lien, après <code className="font-mono">placeid=</code>.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="https://developers.google.com/maps/documentation/places/web-service/place-id"
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Trouver mon Place ID</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <a
              href="https://wa.me/?text=Bonjour,%20pouvez-vous%20m'aider%20à%20configurer%20mon%20Place%20ID%20Google%20?"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-zinc-900"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Demander sur WhatsApp</span>
            </a>
          </div>

          <div className="border-border bg-muted/40 rounded-xl border p-3.5 text-xs leading-relaxed">
            <p className="text-muted-foreground">
              Le client laisse un avis, puis demande son bonus depuis sa carte.{" "}
              <span className="text-foreground font-bold">
                Vous validez chaque demande
              </span>{" "}
              depuis l&apos;onglet{" "}
              <span className="font-bold">Avis Google</span> &mdash; le bonus
              n&apos;est crédité qu&apos;
              <span className="text-foreground font-bold">
                une seule fois par client
              </span>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-foreground text-background hover:bg-foreground/90 h-11 px-6 font-bold shadow-xs"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
};

export default ProgramSettingsPage;
