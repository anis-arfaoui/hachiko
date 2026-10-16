"use client";

import { Check, Loader2, Save, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import type { CSSProperties, ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  getProgramAndOrgDetailsAction,
  saveAppearanceAction,
} from "@/app/actions/program";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ESTABLISHMENT_TYPES = [
  { icon: "🍽️", id: "restaurant", label: "Restaurant" },
  { icon: "☕", id: "cafe", label: "Café" },
  { icon: "✂️", id: "coiffure", label: "Coiffure" },
  { icon: "💈", id: "barbershop", label: "Barbershop" },
  { icon: "🥐", id: "patisserie", label: "Pâtisserie" },
  { icon: "👕", id: "vetements", label: "Vêtements" },
  { icon: "💄", id: "cosmetique", label: "Cosmétique" },
  { icon: "🏪", id: "autre", label: "Autre" },
] as const;

const COLOR_SWATCHES = [
  { label: "Noir", value: "#1a1a1a" },
  { label: "Corail", value: "#f95738" },
  { label: "Bleu", value: "#1d4ed8" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Framboise", value: "#db2777" },
  { label: "Émeraude", value: "#059669" },
  { label: "Caramel", value: "#92400e" },
  { label: "Bordeaux", value: "#831843" },
] as const;

const IMAGE_EXT_REGEX = /\.(?:png|jpe?g|webp|svg)$/iu;

const resizeImageFile = (
  file: File,
  maxDimension: number,
  onSuccess: (dataUrl: string) => void,
  onError: () => void
) => {
  const reader = new FileReader();
  reader.addEventListener(
    "error",
    () => {
      onError();
    },
    { once: true }
  );
  reader.addEventListener(
    "load",
    () => {
      if (!reader.result) {
        onError();
        return;
      }

      const rawDataUrl = String(reader.result);
      if (file.type === "image/svg+xml") {
        onSuccess(rawDataUrl);
        return;
      }

      const img = new window.Image();
      img.addEventListener(
        "error",
        () => {
          onSuccess(rawDataUrl);
        },
        { once: true }
      );
      img.addEventListener(
        "load",
        () => {
          try {
            let { width, height } = img;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = Math.max(width, 1);
            canvas.height = Math.max(height, 1);
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              onSuccess(rawDataUrl);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            try {
              const dataUrl = canvas.toDataURL("image/webp", 0.85);
              if (dataUrl && dataUrl.startsWith("data:image/webp")) {
                onSuccess(dataUrl);
                return;
              }
            } catch {
              // fallback
            }

            onSuccess(canvas.toDataURL("image/png"));
          } catch {
            onSuccess(rawDataUrl);
          }
        },
        { once: true }
      );
      img.src = rawDataUrl;
    },
    { once: true }
  );
  reader.readAsDataURL(file);
};

const AppearancePage = () => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [isDraggingBg, setIsDraggingBg] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  // Appearance state
  const [category, setCategory] = useState("cafe");
  const [businessName, setBusinessName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("#92400e");
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [programType, setProgramType] = useState<"stamps" | "points">("stamps");
  const [stampsRequired, setStampsRequired] = useState(10);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await getProgramAndOrgDetailsAction();
        if (data && isMounted) {
          setBusinessName(data.org.name || "");
          if (data.org.metadata.category) {
            setCategory(data.org.metadata.category);
          }
          if (data.org.metadata.bgImageUrl) {
            setBgImageUrl(data.org.metadata.bgImageUrl);
          }
          if (data.program) {
            setBrandColor(data.program.brandColor || "#92400e");
            setLogoUrl(data.program.logoUrl || data.org.logo || "");
            setProgramType(
              data.program.type === "points" ? "points" : "stamps"
            );
            setStampsRequired(data.program.stampsRequired || 10);
          } else if (data.org.logo) {
            setLogoUrl(data.org.logo);
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

  const selectedCategoryObj = useMemo(
    () =>
      ESTABLISHMENT_TYPES.find((item) => item.id === category) ??
      ESTABLISHMENT_TYPES[1],
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

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/") && !IMAGE_EXT_REGEX.test(file.name)) {
      setSaveMessage({
        text: "Format de fichier non supporté. Veuillez choisir une image (PNG, JPG, WebP ou SVG).",
        type: "error",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSaveMessage({
        text: "Le logo dépasse la taille maximale autorisée de 10 Mo.",
        type: "error",
      });
      return;
    }

    setIsProcessingLogo(true);
    setSaveMessage(null);

    resizeImageFile(
      file,
      512,
      (resized) => {
        setLogoUrl(resized);
        setIsProcessingLogo(false);
        if (logoInputRef.current) {
          logoInputRef.current.value = "";
        }
      },
      () => {
        setSaveMessage({
          text: "Impossible de lire le fichier sélectionné.",
          type: "error",
        });
        setIsProcessingLogo(false);
        if (logoInputRef.current) {
          logoInputRef.current.value = "";
        }
      }
    );
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoFile(file);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const handleBgImageFile = (file: File) => {
    if (!file.type.startsWith("image/") && !IMAGE_EXT_REGEX.test(file.name)) {
      setSaveMessage({
        text: "Format de fichier non supporté. Veuillez choisir une image (PNG, JPG, WebP ou SVG).",
        type: "error",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSaveMessage({
        text: "L'image de fond dépasse la taille maximale autorisée de 10 Mo.",
        type: "error",
      });
      return;
    }

    setIsProcessingBg(true);
    setSaveMessage(null);

    resizeImageFile(
      file,
      1280,
      (resized) => {
        setBgImageUrl(resized);
        setIsProcessingBg(false);
        if (bgInputRef.current) {
          bgInputRef.current.value = "";
        }
      },
      () => {
        setSaveMessage({
          text: "Impossible de lire l'image de fond sélectionnée.",
          type: "error",
        });
        setIsProcessingBg(false);
        if (bgInputRef.current) {
          bgInputRef.current.value = "";
        }
      }
    );
  };

  const getLogoBoxBorderClass = () => {
    if (isDraggingLogo) {
      return "border-primary bg-primary/10 ring-primary/30 ring-2 scale-105";
    }
    if (logoUrl) {
      return "border-border bg-muted/20 hover:border-foreground/50 hover:shadow-xs";
    }
    return "border-border hover:border-foreground/50 hover:bg-muted/40 border-2 border-dashed bg-muted/20 shadow-xs";
  };

  const renderLogoBoxContent = () => {
    if (isProcessingLogo) {
      return <Loader2 className="text-foreground h-6 w-6 animate-spin" />;
    }
    if (logoUrl) {
      return (
        <>
          <Image
            src={logoUrl}
            alt="Logo"
            fill
            sizes="64px"
            className="object-cover transition-opacity group-hover:opacity-75"
            unoptimized
          />
          <div className="bg-foreground/50 absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <Upload className="h-4 w-4 text-white drop-shadow-sm" />
          </div>
        </>
      );
    }
    return (
      <div className="text-muted-foreground group-hover:text-foreground flex flex-col items-center justify-center gap-1 transition-colors">
        <Upload className="h-5 w-5" />
      </div>
    );
  };

  const renderBgBoxContent = () => {
    if (isProcessingBg) {
      return <Loader2 className="text-foreground h-6 w-6 animate-spin" />;
    }
    if (bgImageUrl) {
      return (
        <div className="relative h-full w-full overflow-hidden rounded-xl">
          <Image
            src={bgImageUrl}
            alt="Fond de carte"
            fill
            sizes="144px"
            className="object-cover"
            unoptimized
          />
        </div>
      );
    }
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-1.5 text-center">
        <Upload className="h-5 w-5" />
        <span className="text-[11px] font-medium">Image de fond</span>
      </div>
    );
  };

  const handleBgImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBgImageFile(file);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleRemoveBgImage = () => {
    setBgImageUrl("");
    if (bgInputRef.current) {
      bgInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      setSaveMessage({
        text: "Veuillez renseigner le nom de l'établissement.",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await saveAppearanceAction({
        bgImageUrl,
        brandColor,
        businessName,
        category,
        logoUrl,
      });

      if (res.success) {
        setSaveMessage({
          text: "Apparence enregistrée avec succès !",
          type: "success",
        });
      } else {
        setSaveMessage({
          text: "Erreur lors de l'enregistrement de l'apparence.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Save appearance error:", error);
      setSaveMessage({
        text: "Une erreur est survenue lors de l'enregistrement.",
        type: "error",
      });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="text-foreground h-4 w-4 animate-spin" />
          <span>Chargement de l&apos;apparence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-foreground text-3xl font-black tracking-tight uppercase">
          Apparence
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personnalisez votre carte de fidélité et l&apos;identité de votre
          établissement
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

      {/* 1. Type d'établissement */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <CardTitle className="text-base font-bold">
            Type d&apos;établissement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {ESTABLISHMENT_TYPES.map((item) => {
              const isSelected = category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all",
                    isSelected
                      ? "border-foreground bg-foreground/5 text-foreground ring-foreground/20 font-bold shadow-xs ring-2"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="mb-2 text-2xl leading-none">
                    {item.icon}
                  </span>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Identité */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <CardTitle className="text-base font-bold">Identité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Nom de l'établissement */}
          <div className="space-y-2">
            <Label
              htmlFor="businessName"
              className="text-foreground text-xs font-bold"
            >
              Nom de l&apos;établissement
            </Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: 9hwa"
              className="h-11"
              required
            />
          </div>

          {/* Logo */}
          <div className="space-y-2.5">
            <Label className="text-foreground text-xs font-bold">Logo</Label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*,.png,.jpg,.jpeg,.webp,.svg"
              className="hidden"
              onChange={handleLogoUpload}
            />

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingLogo(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingLogo(false);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingLogo(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    await handleLogoFile(file);
                  }
                }}
                disabled={isProcessingLogo}
                aria-label={logoUrl ? "Changer le logo" : "Ajouter un logo"}
                className={cn(
                  "group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border transition-all",
                  getLogoBoxBorderClass()
                )}
              >
                {renderLogoBoxContent()}
              </button>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isProcessingLogo}
                    className="h-8 cursor-pointer text-xs font-semibold"
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {logoUrl ? "Changer le logo" : "Ajouter un logo"}
                  </Button>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={isProcessingLogo}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 cursor-pointer text-xs transition-colors"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      <span>Supprimer</span>
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Cliquez ou glissez-déposez &bull; PNG, JPG, WebP ou SVG
                  <br />
                  Redimensionné automatiquement (max 512&times;512px)
                </p>
              </div>
            </div>
          </div>

          {/* Couleur principale */}
          <div className="space-y-3">
            <Label className="text-foreground text-xs font-bold">
              Couleur principale
            </Label>

            {/* Color Swatches */}
            <div className="flex flex-wrap items-center gap-2.5">
              {COLOR_SWATCHES.map((swatch) => {
                const isSelected =
                  brandColor.toLowerCase() === swatch.value.toLowerCase();
                return (
                  <button
                    key={swatch.value}
                    type="button"
                    onClick={() => setBrandColor(swatch.value)}
                    aria-label={swatch.label}
                    className={cn(
                      "flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl [background-color:var(--swatch-color)] transition-all",
                      isSelected
                        ? "ring-foreground scale-110 shadow-sm ring-2 ring-offset-2"
                        : "opacity-90 hover:scale-105 hover:opacity-100"
                    )}
                    style={
                      {
                        "--swatch-color": swatch.value,
                      } as CSSProperties
                    }
                  >
                    {isSelected && (
                      <Check className="h-4 w-4 stroke-[3] text-white drop-shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Color Picker */}
            <div className="border-border bg-card flex max-w-[200px] items-center gap-2.5 rounded-xl border p-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
              />
              <Input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#92400e"
                maxLength={7}
                className="h-7 border-0 p-0 font-mono text-xs font-semibold focus-visible:ring-0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Image de fond de la carte */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <CardTitle className="text-base font-bold">
            Image de fond de la carte
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <input
            ref={bgInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*,.png,.jpg,.jpeg,.webp,.svg"
            className="hidden"
            onChange={handleBgImageUpload}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => bgInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingBg(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingBg(false);
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingBg(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  await handleBgImageFile(file);
                }
              }}
              disabled={isProcessingBg}
              aria-label={
                bgImageUrl
                  ? "Changer l'image de fond"
                  : "Ajouter une image de fond"
              }
              className={cn(
                "border-border hover:bg-muted/30 hover:border-foreground/50 relative flex h-24 w-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all",
                isDraggingBg &&
                  "border-primary bg-primary/10 ring-primary/30 scale-105 ring-2"
              )}
            >
              {renderBgBoxContent()}
            </button>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bgInputRef.current?.click()}
                  disabled={isProcessingBg}
                  className="h-8 cursor-pointer text-xs font-semibold"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {bgImageUrl ? "Changer l'image" : "Ajouter une image"}
                </Button>
                {bgImageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveBgImage}
                    disabled={isProcessingBg}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 cursor-pointer text-xs transition-colors"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    <span>Supprimer</span>
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Optionnel &bull; redimensionnée automatiquement
                <br />
                Affichée en fond de la carte, teintée à votre couleur
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Aperçu de la carte (temps réel) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold">
              Aperçu de la carte
            </CardTitle>
            <span className="text-muted-foreground text-xs font-normal">
              (temps réel)
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Card Presentation Container */}
          <div className="mx-auto w-full max-w-lg">
            <div
              className="relative aspect-[1.7/1] w-full overflow-hidden rounded-3xl [background-color:var(--card-brand)] p-6 text-white shadow-xl transition-all"
              style={
                {
                  "--card-brand": brandColor,
                } as CSSProperties
              }
            >
              {/* Optional background image overlay */}
              {bgImageUrl && (
                <div
                  className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
                  style={
                    {
                      backgroundImage: `url(${bgImageUrl})`,
                    } as CSSProperties
                  }
                />
              )}

              {/* Decorative Apple Wallet style watermarks / circles */}
              <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10 blur-xs" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-xs" />

              {/* Top Row: Logo & Business Info + Points/Tampons */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white/20 shadow-xs">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xl">
                        {selectedCategoryObj.icon}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg leading-tight font-extrabold text-white">
                      {businessName.trim() || "Mon Commerce"}
                    </h3>
                    <p className="text-xs font-medium text-white/80">
                      {selectedCategoryObj.label} &bull; Carte de fidélité
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="block text-[11px] font-bold tracking-wider text-white/70 uppercase">
                    {programType === "points" ? "Points" : "Tampons"}
                  </span>
                  <span className="text-2xl leading-none font-black text-white">
                    {programType === "points" ? "0" : `0/${stampsRequired}`}
                  </span>
                </div>
              </div>

              {/* Bottom Row: Member Since */}
              <div className="relative z-10 mt-auto flex items-end justify-between pt-10">
                <div>
                  <span className="block text-[11px] font-medium text-white/70">
                    Membre depuis
                  </span>
                  <span className="text-sm font-bold text-white">
                    {monthYear}
                  </span>
                </div>
              </div>
            </div>
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
          {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
};

export default AppearancePage;
