"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Gift,
  HelpCircle,
  Loader2,
  Stamp,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";

import { completeOnboardingAction } from "@/app/actions/program";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ESTABLISHMENT_CATEGORIES = [
  { icon: "🍽️", id: "restaurant", label: "Restaurant" },
  { icon: "☕", id: "cafe", label: "Café" },
  { icon: "✂️", id: "coiffure", label: "Coiffure" },
  { icon: "💈", id: "barbershop", label: "Barbershop" },
  { icon: "👔", id: "pressing", label: "Pressing" },
  { icon: "🧵", id: "retoucherie", label: "Retoucherie" },
  { icon: "🥩", id: "boucherie", label: "Boucherie" },
  { icon: "🥐", id: "patisserie", label: "Pâtisserie" },
  { icon: "📚", id: "librairie", label: "Librairie" },
  { icon: "🏪", id: "autre", label: "Autre" },
] as const;

const COLOR_SWATCHES = [
  { label: "Noir", value: "#1a1a1a" },
  { label: "Corail", value: "#f95738" },
  { label: "Bleu", value: "#1d4ed8" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Émeraude", value: "#059669" },
  { label: "Vert Forêt", value: "#166534" },
  { label: "Terre cuite", value: "#c2410c" },
  { label: "Bordeaux", value: "#831843" },
] as const;

const STAMP_PRESETS = [6, 8, 10, 12];
const POINT_PRESETS = [50, 100, 200, 500];

interface OnboardingWizardProps {
  initialBusinessName: string;
}

export const OnboardingWizard = ({
  initialBusinessName,
}: OnboardingWizardProps) => {
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Step 1: Établissement
  const [category, setCategory] = useState<string>("restaurant");
  const [businessName, setBusinessName] = useState(initialBusinessName || "");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [brandColor, setBrandColor] = useState<string>("#1a1a1a");

  // Step 2: Mécanique de fidélité
  const [programType, setProgramType] = useState<"stamps" | "points">("stamps");
  const [stampsInput, setStampsInput] = useState<string>("10");
  const [pointsPerSpendInput, setPointsPerSpendInput] = useState<string>("1");
  const [minSpendInput, setMinSpendInput] = useState<string>("200");
  const [pointsRequiredInput, setPointsRequiredInput] = useState<string>("100");
  const [rewardLabel, setRewardLabel] = useState<string>(
    "1 café ou thé offert"
  );

  // Validation logic
  const parsedStamps = Math.trunc(Number(stampsInput.trim()));
  const isStampsValid =
    !Number.isNaN(parsedStamps) && parsedStamps >= 2 && parsedStamps <= 30;

  const parsedPointsPerSpend = Math.trunc(Number(pointsPerSpendInput.trim()));
  const parsedMinSpend = Math.trunc(Number(minSpendInput.trim()));
  const parsedPointsRequired = Math.trunc(Number(pointsRequiredInput.trim()));

  const isPointsValid =
    !Number.isNaN(parsedPointsRequired) &&
    parsedPointsRequired >= 5 &&
    parsedPointsRequired <= 5000 &&
    !Number.isNaN(parsedPointsPerSpend) &&
    parsedPointsPerSpend >= 1 &&
    !Number.isNaN(parsedMinSpend) &&
    parsedMinSpend >= 0;

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCategoryObj = useMemo(
    () =>
      ESTABLISHMENT_CATEGORIES.find((c) => c.id === category) ??
      ESTABLISHMENT_CATEGORIES[0],
    [category]
  );

  const monthYear = useMemo(() => {
    try {
      const formatted = new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
      }).format(new Date());
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return "Juin 2026";
    }
  }, []);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Le logo dépasse la taille maximale de 2 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        if (reader.result) {
          setLogoUrl(String(reader.result));
        }
      },
      { once: true }
    );
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectProgramType = (type: "stamps" | "points") => {
    setProgramType(type);
    if (type === "stamps") {
      if (
        rewardLabel === "1 plat offert ou 500 DA de remise" ||
        !rewardLabel.trim()
      ) {
        setRewardLabel("1 café ou thé offert");
      }
    } else if (rewardLabel === "1 café ou thé offert" || !rewardLabel.trim()) {
      setRewardLabel("1 plat offert ou 500 DA de remise");
    }
  };

  const handleContinueToStep2 = () => {
    if (!businessName.trim()) {
      setErrorMessage("Veuillez renseigner le nom de votre établissement.");
      return;
    }
    setErrorMessage(null);
    setCurrentStep(2);
    window.scrollTo({ top: 0 });
  };

  const handleBackToStep1 = () => {
    setErrorMessage(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0 });
  };

  const handleFinalSubmit = async () => {
    if (!rewardLabel.trim()) {
      setErrorMessage("Veuillez définir une récompense pour vos clients.");
      return;
    }

    if (programType === "stamps" && !isStampsValid) {
      setErrorMessage(
        "Le nombre de tampons doit être un nombre valide compris entre 2 et 30."
      );
      return;
    }

    if (programType === "points" && !isPointsValid) {
      setErrorMessage(
        "Veuillez vérifier les paramètres du programme à points (au moins 5 points requis)."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const targetRequired =
      programType === "points" ? parsedPointsRequired : parsedStamps;

    try {
      const res = await completeOnboardingAction({
        brandColor,
        businessName: businessName.trim(),
        category,
        logoUrl: logoUrl || undefined,
        minSpend: programType === "points" ? parsedMinSpend : undefined,
        pointsPerSpend:
          programType === "points" ? parsedPointsPerSpend : undefined,
        programType,
        rewardLabel: rewardLabel.trim(),
        targetRequired,
      });

      if (!res.success) {
        setErrorMessage(
          res.error ?? "Une erreur est survenue lors de la configuration."
        );
        setIsSubmitting(false);
        return;
      }

      window.location.href = `/${locale}/dashboard`;
    } catch {
      setErrorMessage("Erreur de connexion. Veuillez réessayer.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start px-4 py-8 sm:py-12">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex items-center gap-2.5">
          <Image
            src="/walaa-logo.png"
            alt="Walaa"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover shadow-xs"
            priority
          />
          <span className="text-foreground text-xl font-bold tracking-tight">
            Walaa
          </span>
        </div>

        <h1 className="text-foreground text-2xl font-black tracking-tight sm:text-3xl">
          Bienvenue 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configurez votre {selectedCategoryObj.label.toLowerCase()} en 2 étapes
          rapides
        </p>

        {/* Stepper */}
        <div className="mt-6 flex flex-col items-center">
          <div className="flex items-center gap-3">
            {/* Step 1 Circle */}
            <div
              className={cn(
                "bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              )}
            >
              {currentStep > 1 ? <Check className="h-4 w-4 stroke-[3]" /> : "1"}
            </div>

            {/* Connecting Line */}
            <div
              className={cn(
                "h-0.5 w-14 transition-colors",
                currentStep === 2 ? "bg-primary" : "bg-border"
              )}
            />

            {/* Step 2 Circle */}
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                currentStep === 2
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground border-border border"
              )}
            >
              2
            </div>
          </div>

          <div className="text-muted-foreground mt-2 flex w-64 justify-between text-xs font-medium">
            <span
              className={cn(currentStep === 1 && "text-foreground font-bold")}
            >
              Votre établissement
            </span>
            <span
              className={cn(currentStep === 2 && "text-foreground font-bold")}
            >
              Mécanique de fidélité
            </span>
          </div>
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="border-border bg-card w-full max-w-xl rounded-2xl border p-6 shadow-xs sm:p-8">
        {errorMessage && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive mb-5 rounded-xl border p-3.5 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: VOTRE ÉTABLISSEMENT */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-foreground text-xl font-black tracking-tight uppercase sm:text-2xl">
                Votre établissement
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Ces informations apparaîtront sur la carte de fidélité
              </p>
            </div>

            <div className="bg-border h-px" />

            {/* Category Grid */}
            <div className="space-y-2.5">
              <Label className="text-foreground text-xs font-semibold">
                Type d&apos;établissement{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {ESTABLISHMENT_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <span className="text-xl leading-none">{cat.icon}</span>
                      <span className="mt-1.5 text-xs leading-tight font-medium">
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Establishment Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="businessName"
                className="text-foreground text-xs font-semibold"
              >
                Nom du {selectedCategoryObj.label}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-1.5">
              <Label className="text-foreground text-xs font-semibold">
                Logo (optionnel)
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />

              {logoUrl ? (
                <div className="border-border bg-muted/40 flex items-center gap-3 rounded-xl border p-2.5">
                  <div className="border-border bg-background relative h-12 w-12 overflow-hidden rounded-lg border">
                    <Image
                      src={logoUrl}
                      alt="Logo sélectionné"
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="text-muted-foreground flex-1 truncate text-xs">
                    Logo importé avec succès
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-muted-foreground hover:text-destructive flex h-8 w-8 items-center justify-center rounded-lg p-0 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-border bg-muted/30 hover:bg-muted flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors"
                >
                  <Upload className="text-muted-foreground h-5 w-5" />
                  <span className="text-foreground mt-1 text-xs font-medium">
                    PNG / JPG
                  </span>
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    Max 2 Mo — recommandé 512×512px
                  </span>
                </button>
              )}
            </div>

            {/* Card Main Color */}
            <div className="space-y-2.5">
              <Label className="text-foreground text-xs font-semibold">
                Couleur principale de la carte{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap items-center gap-2.5">
                {COLOR_SWATCHES.map((swatch) => {
                  const isSelected =
                    brandColor.toLowerCase() === swatch.value.toLowerCase();
                  return (
                    <button
                      key={swatch.value}
                      type="button"
                      onClick={() => setBrandColor(swatch.value)}
                      title={swatch.label}
                      aria-label={swatch.label}
                      className={cn(
                        "h-8 w-8 cursor-pointer rounded-full border [background-color:var(--swatch-color)] transition-transform",
                        isSelected
                          ? "ring-foreground ring-2 ring-offset-2"
                          : "border-black/10 hover:scale-105"
                      )}
                      style={
                        {
                          "--swatch-color": swatch.value,
                        } as CSSProperties
                      }
                    />
                  );
                })}
              </div>

              {/* Hex Input */}
              <div className="border-border bg-background flex max-w-[200px] items-center gap-2 rounded-xl border p-1.5">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#1a1a1a"
                  className="text-foreground h-7 flex-1 border-0 bg-transparent p-0 font-mono text-xs font-medium outline-hidden"
                  maxLength={7}
                />
              </div>
            </div>

            {/* Live Interactive Card Preview */}
            <div className="space-y-2 pt-1">
              <Label className="text-foreground text-xs font-semibold">
                Aperçu de votre carte
              </Label>
              <div
                className="relative overflow-hidden rounded-2xl [background-color:var(--card-brand)] p-5 text-white shadow-md transition-colors"
                style={
                  {
                    "--card-brand": brandColor,
                  } as CSSProperties
                }
              >
                {/* Decorative background circle */}
                <div className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10" />

                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 backdrop-blur-sm">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt="Logo"
                          width={44}
                          height={44}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-2xl">
                          {selectedCategoryObj.icon}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="leading-tight font-bold text-white">
                        {businessName.trim() || "Nom de l'établissement"}
                      </h4>
                      <p className="mt-0.5 text-xs text-white/80">
                        {selectedCategoryObj.label} &bull; Carte de fidélité
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs font-medium tracking-wider text-white/70 uppercase">
                      Points
                    </span>
                    <span className="text-2xl leading-none font-black text-white">
                      0
                    </span>
                  </div>
                </div>

                <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/15 pt-3 text-xs text-white/80">
                  <span>Membre depuis</span>
                  <span className="font-semibold text-white">{monthYear}</span>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleContinueToStep2}
                className="w-full"
                size="lg"
              >
                Continuer <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: MÉCANIQUE DE FIDÉLITÉ */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-foreground text-xl font-bold tracking-tight">
                  Mécanique de fidélité
                </h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Comment récompensez-vous vos clients fidèles ?
                </p>
              </div>
            </div>

            <div className="bg-border h-px" />

            {/* System Selector Cards */}
            <div className="space-y-2">
              <Label className="text-foreground text-xs font-semibold">
                Choisissez votre système
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Points Card */}
                <button
                  type="button"
                  onClick={() => handleSelectProgramType("points")}
                  className={cn(
                    "relative flex cursor-pointer flex-col items-start rounded-xl border p-4 text-left transition-colors",
                    programType === "points"
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  {programType === "points" && (
                    <div className="bg-primary text-primary-foreground absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                  <div className="bg-muted text-foreground mb-2 flex h-8 w-8 items-center justify-center rounded-lg">
                    <Zap className="h-4 w-4" />
                  </div>
                  <h4 className="text-foreground text-sm font-bold">
                    Système à points
                  </h4>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Les clients accumulent des points à chaque achat.
                  </p>
                </button>

                {/* Stamps Card */}
                <button
                  type="button"
                  onClick={() => handleSelectProgramType("stamps")}
                  className={cn(
                    "relative flex cursor-pointer flex-col items-start rounded-xl border p-4 text-left transition-colors",
                    programType === "stamps"
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  {programType === "stamps" && (
                    <div className="bg-primary text-primary-foreground absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                  <div className="bg-muted text-foreground mb-2 flex h-8 w-8 items-center justify-center rounded-lg">
                    <Stamp className="h-4 w-4" />
                  </div>
                  <h4 className="text-foreground text-sm font-bold">
                    Carte à tampons
                  </h4>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Chaque visite ajoute un tampon. Carte complète = récompense.
                  </p>
                </button>
              </div>
            </div>

            {/* Informational Tip Banner */}
            <div className="border-border bg-primary/5 text-foreground border-primary/20 flex items-center gap-2.5 rounded-xl border p-3.5 text-xs">
              <HelpCircle className="text-primary h-4 w-4 shrink-0" />
              <span>
                {programType === "stamps"
                  ? `Ex : ${isStampsValid ? parsedStamps : 10} tampons = ${rewardLabel.trim() || "1 café ou thé offert"}`
                  : `Ex : ${isPointsValid ? parsedPointsPerSpend : 1} point${(isPointsValid ? parsedPointsPerSpend : 1) > 1 ? "s" : ""} par 100 DA dépensé → ${isPointsValid ? parsedPointsRequired : 100} points = ${rewardLabel.trim() || "1 plat offert"}`}
              </span>
            </div>

            {/* Stamps Mechanic Config */}
            {programType === "stamps" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="stampsInput"
                      className="text-foreground text-xs font-semibold"
                    >
                      Nombre de tampons par carte
                    </Label>
                    <span className="text-muted-foreground text-xs font-semibold">
                      {isStampsValid
                        ? `${parsedStamps} tampons`
                        : "2 à 30 tampons"}
                    </span>
                  </div>

                  <div className="relative">
                    <Input
                      id="stampsInput"
                      type="number"
                      min={2}
                      max={30}
                      value={stampsInput}
                      onChange={(e) => setStampsInput(e.target.value)}
                      placeholder="10"
                      className="pr-20 text-sm font-medium"
                    />
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium">
                      tampons
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-muted-foreground text-xs">
                      Suggestions :
                    </span>
                    {STAMP_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setStampsInput(String(preset))}
                        className={cn(
                          "h-7 cursor-pointer rounded-lg border px-2.5 text-xs font-medium transition-colors",
                          parsedStamps === preset
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border bg-muted/60 text-foreground hover:bg-muted"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stamp Circles Preview */}
                {isStampsValid ? (
                  <div className="border-border bg-muted/20 rounded-xl border p-4">
                    <span className="text-muted-foreground block text-xs font-medium">
                      Aperçu de la carte
                    </span>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {Array.from({ length: parsedStamps }).map((_, idx) => (
                        <div
                          key={`preview-stamp-${idx}`}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full [border-color:var(--brand-border)] [background-color:var(--brand-circle)] text-xs",
                            idx === 0
                              ? "text-white shadow-xs"
                              : "text-muted-foreground border-2"
                          )}
                          style={
                            {
                              "--brand-border": `${brandColor}80`,
                              "--brand-circle":
                                idx === 0 ? brandColor : "transparent",
                            } as CSSProperties
                          }
                        >
                          {idx === 0 ? <Stamp className="h-4 w-4" /> : null}
                        </div>
                      ))}
                    </div>
                    <p className="text-muted-foreground mt-3 text-xs">
                      {parsedStamps} tampons &rarr; récompense débloquée
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-semibold">
                      ⚠️ Nombre de tampons invalide ({stampsInput || "vide"})
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Le nombre de tampons doit être compris entre 2 et 30 pour
                      afficher l&apos;aperçu de la carte et créer votre espace.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Points Mechanic Config */}
            {programType === "points" && (
              <div className="space-y-4">
                {/* 2 columns: Points par 100 DA & Achat minimum (DA) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="pointsPerSpendInput"
                      className="text-foreground text-xs font-semibold"
                    >
                      Points par 100 DA
                    </Label>
                    <Input
                      id="pointsPerSpendInput"
                      type="number"
                      min={1}
                      max={100}
                      value={pointsPerSpendInput}
                      onChange={(e) => setPointsPerSpendInput(e.target.value)}
                      placeholder="1"
                      className="text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="minSpendInput"
                      className="text-foreground text-xs font-semibold"
                    >
                      Achat minimum (DA)
                    </Label>
                    <Input
                      id="minSpendInput"
                      type="number"
                      min={0}
                      step={50}
                      value={minSpendInput}
                      onChange={(e) => setMinSpendInput(e.target.value)}
                      placeholder="200"
                      className="text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Points required for reward */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="pointsRequiredInput"
                    className="text-foreground text-xs font-semibold"
                  >
                    Points pour la récompense
                  </Label>
                  <div className="relative">
                    <Input
                      id="pointsRequiredInput"
                      type="number"
                      min={5}
                      max={5000}
                      step={10}
                      value={pointsRequiredInput}
                      onChange={(e) => setPointsRequiredInput(e.target.value)}
                      placeholder="100"
                      className="pr-16 text-sm font-medium"
                    />
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium">
                      points
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-muted-foreground text-xs">
                      Suggestions :
                    </span>
                    {POINT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPointsRequiredInput(String(preset))}
                        className={cn(
                          "h-7 cursor-pointer rounded-lg border px-2.5 text-xs font-medium transition-colors",
                          parsedPointsRequired === preset
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border bg-muted/60 text-foreground hover:bg-muted"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Points Progress Preview */}
                {isPointsValid ? (
                  <div className="border-border bg-muted/20 rounded-xl border p-4">
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span className="font-medium">Aperçu de la carte</span>
                      <span className="font-bold">
                        0 / {parsedPointsRequired} pts
                      </span>
                    </div>

                    <div className="bg-muted mt-2.5 h-3 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full [background-color:var(--brand-progress)] transition-[width]"
                        style={
                          {
                            "--brand-progress": brandColor,
                            width: "35%",
                          } as CSSProperties
                        }
                      />
                    </div>

                    <p className="text-muted-foreground mt-3 text-xs">
                      {parsedPointsRequired} points &rarr; récompense débloquée
                      🎁
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-semibold">
                      ⚠️ Configuration des points invalide
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Veuillez renseigner un barème de points valide (au moins 5
                      points requis) pour afficher la carte et continuer.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reward Label Input */}
            <div className="space-y-1.5">
              <Label
                htmlFor="rewardLabel"
                className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
              >
                <span>🎁</span> Description de la récompense{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rewardLabel"
                value={rewardLabel}
                onChange={(e) => setRewardLabel(e.target.value)}
                placeholder={
                  programType === "stamps"
                    ? "Ex : 1 café ou thé offert"
                    : "Ex : Réduction de 500 DA sur votre prochain repas"
                }
                required
              />
              <p className="text-muted-foreground text-xs">
                Ce texte apparaîtra clairement sur la carte du client
                lorsqu&apos;il débloquera sa récompense.
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleBackToStep1}
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Retour
              </Button>

              <Button
                type="button"
                size="lg"
                onClick={handleFinalSubmit}
                disabled={
                  isSubmitting ||
                  (programType === "stamps"
                    ? !isStampsValid
                    : !isPointsValid) ||
                  !rewardLabel.trim()
                }
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>Créer mon espace 🎁</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
